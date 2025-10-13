import { Router } from "express";
import multer from "multer";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { exporter } from "./services/exporter";
import { s3Service } from "./services/s3";
import { imageScraper } from "./services/image-scraper";
import { getConfig, updateConfig, resetConfig } from "./config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from 'zod';

export const apiRouter = Router();

// Scraping request schemas
const optionsSchema = z.object({
  headless: z.boolean().optional(),
  screenshotsEnabled: z.boolean().optional()
}).optional();

const fullScrapeSchema = z.object({ options: optionsSchema });
const franchiseScrapeSchema = z.object({ franchiseId: z.string(), options: optionsSchema });
const seasonScrapeSchema = z.object({ seasonId: z.string(), options: optionsSchema });
const contestantScrapeSchema = z.object({ contestantId: z.string(), options: optionsSchema });

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Scraping endpoints
apiRouter.get('/scrape/status', (req, res) => {
  try {
    const status = scraper.getStatus();
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scraping status' });
  }
});

const handleScrapingRequest = async (res: any, schema: z.ZodType<any>, level: 'full' | 'franchise' | 'season' | 'contestant', data: any) => {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request', details: result.error });
    }

    const { options, ...ids } = result.data;
    const request = { level, ...ids };

    const job = await scraper.startScraping(request, options || {});
    res.json(job);
  } catch (error) {
    console.error(`Scraping error for level ${level}:`, error);
    res.status(500).json({ error: `Failed to start ${level} scraping`, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

apiRouter.post('/scrape/full', (req, res) => handleScrapingRequest(res, fullScrapeSchema, 'full', req.body));
apiRouter.post('/scrape/franchise', (req, res) => handleScrapingRequest(res, franchiseScrapeSchema, 'franchise', req.body));
apiRouter.post('/scrape/season', (req, res) => handleScrapingRequest(res, seasonScrapeSchema, 'season', req.body));
apiRouter.post('/scrape/contestant', (req, res) => handleScrapingRequest(res, contestantScrapeSchema, 'contestant', req.body));

apiRouter.post('/scrape/stop', async (req, res) => {
  try {
    await scraper.stopScraping();
    res.json({ status: 'stopped' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop scraping' });
  }
});

// Stats endpoint
apiRouter.get("/stats", async (req, res) => {
  try {
    const stats = await storage.getAppStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Contestants endpoints
apiRouter.get("/contestants", async (req, res) => {
  try {
    const { search, seasonId, limit } = req.query;
    let contestants;

    if (seasonId) {
      contestants = await storage.getContestantsBySeason(seasonId as string);
    } else if (search) {
      contestants = await storage.getContestantsBySearch(search as string);
    } else {
      contestants = await storage.getContestants();
    }

    if (limit) {
      res.json(contestants.slice(0, parseInt(limit as string)));
    } else {
      res.json(contestants);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contestants" });
  }
});

// Individual contestant endpoint
apiRouter.get("/contestants/:id", async (req, res) => {
  try {
    const contestant = await storage.getContestant(req.params.id);
    if (!contestant) {
      return res.status(404).json({ error: "Contestant not found" });
    }
    res.json(contestant);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contestant" });
  }
});

apiRouter.post("/contestants", async (req, res) => {
  try {
    const newContestant = await storage.createContestant(req.body);
    res.status(201).json(newContestant);
  } catch (error) {
    res.status(500).json({ error: "Failed to create contestant" });
  }
});

apiRouter.patch("/contestants/:id", async (req, res) => {
  try {
    const updatedContestant = await storage.updateContestant(
      req.params.id,
      req.body
    );
    res.json(updatedContestant);
  } catch (error) {
    res.status(500).json({ error: "Failed to update contestant" });
  }
});

apiRouter.delete("/contestants/:id", async (req, res) => {
  try {
    await storage.deleteContestant(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contestant" });
  }
});

// Seasons endpoints
apiRouter.get("/seasons", async (req, res) => {
  try {
    const { franchiseId, sortBy, sortOrder, search } = req.query;
    const seasons = await storage.getAllSeasons({
      franchiseId: franchiseId as string | undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      search: search as string | undefined,
    });
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch seasons" });
  }
});

// Franchises endpoints
apiRouter.get("/franchises", async (req, res) => {
  try {
    const franchises = await storage.getAllFranchises();
    res.json(franchises);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch franchises" });
  }
});

// Individual franchise endpoint
apiRouter.get("/franchises/:id", async (req, res) => {
  try {
    const franchise = await storage.getAllFranchises().then(franchises => 
      franchises.find(f => f.id === req.params.id)
    );
    if (!franchise) {
      return res.status(404).json({ error: "Franchise not found" });
    }
    res.json(franchise);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch franchise" });
  }
});

apiRouter.post("/franchises", async (req, res) => {
  try {
    const newFranchise = await storage.createFranchise(req.body);
    res.status(201).json(newFranchise);
  } catch (error) {
    res.status(500).json({ error: "Failed to create franchise" });
  }
});

apiRouter.patch("/franchises/:id", async (req, res) => {
  try {
    const updatedFranchise = await storage.updateFranchise(req.params.id, req.body);
    res.json(updatedFranchise);
  } catch (error) {
    res.status(500).json({ error: "Failed to update franchise" });
  }
});

apiRouter.delete("/franchises/:id", async (req, res) => {
  try {
    await storage.deleteFranchise(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete franchise" });
  }
});

// Additional seasons endpoints
apiRouter.get("/seasons/:id", async (req, res) => {
  try {
    const season = await storage.getSeason(req.params.id);
    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }
    res.json(season);
  } catch (error) {
    console.error('Error in /seasons/:id endpoint:', error);
    res.status(500).json({ error: "Failed to fetch season" });
  }
});

apiRouter.post("/seasons", async (req, res) => {
  try {
    const newSeason = await storage.createSeason(req.body);
    res.status(201).json(newSeason);
  } catch (error) {
    res.status(500).json({ error: "Failed to create season" });
  }
});

apiRouter.patch("/seasons/:id", async (req, res) => {
  try {
    const updatedSeason = await storage.updateSeason(req.params.id, req.body);
    res.json(updatedSeason);
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

apiRouter.delete("/seasons/:id", async (req, res) => {
  try {
    await storage.deleteSeason(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete season" });
  }
});

// Appearances endpoints
apiRouter.get("/appearances", async (req, res) => {
  try {
    const appearances = await storage.getAllAppearances();
    res.json(appearances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch appearances" });
  }
});

apiRouter.post("/appearances", async (req, res) => {
  try {
    const newAppearance = await storage.createAppearance(req.body);
    res.status(201).json(newAppearance);
  } catch (error) {
    res.status(500).json({ error: "Failed to create appearance" });
  }
});

apiRouter.patch("/appearances/:id", async (req, res) => {
  try {
    const updatedAppearance = await storage.updateAppearance(req.params.id, req.body);
    res.json(updatedAppearance);
  } catch (error) {
    res.status(500).json({ error: "Failed to update appearance" });
  }
});

apiRouter.delete("/appearances/:id", async (req, res) => {
  try {
    await storage.deleteAppearance(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete appearance" });
  }
});

// Related data endpoints
apiRouter.get("/franchises/:id/seasons", async (req, res) => {
  try {
    const seasons = await storage.getSeasonsByFranchise(req.params.id);
    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch seasons for franchise" });
  }
});

apiRouter.get("/seasons/:id/contestants", async (req, res) => {
  try {
    const contestants = await storage.getContestantsBySeason(req.params.id);
    res.json(contestants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contestants for season" });
  }
});

apiRouter.get("/contestants/:id/appearances", async (req, res) => {
  try {
    const appearances = await storage.getAppearancesByContestant(req.params.id);
    res.json(appearances);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch appearances for contestant" });
  }
});


apiRouter.get("/export/csv", async (req, res) => {
  try {
    const zipBuffer = await exporter.exportToCsv();
    res.setHeader("Content-Disposition", 'attachment; filename="export.zip"');
    res.setHeader("Content-Type", "application/zip");
    res.send(zipBuffer);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// S3 upload endpoints
apiRouter.post("/s3/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const result = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      message: "File uploaded successfully",
      key: result.key,
      url: result.url,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to upload file to S3" 
    });
  }
});

apiRouter.post("/s3/test", async (req, res) => {
  try {
    const result = await s3Service.uploadTestFile();
    
    res.json({
      message: "S3 connection test successful",
      key: result.key,
      url: result.url,
    });
  } catch (error) {
    console.error("S3 test error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "S3 connection test failed" 
    });
  }
});

// Debug image scraping endpoint
apiRouter.post("/contestants/:id/debug-images", async (req, res) => {
  try {
    const contestantId = req.params.id;
    const contestant = await storage.getContestant(contestantId);
    
    if (!contestant) {
      return res.status(404).json({ error: "Contestant not found" });
    }

    if (!contestant.metadataSourceUrl) {
      return res.status(400).json({ error: "No metadata source URL available for debugging" });
    }

    console.log(`[debug] Starting image debug for ${contestant.dragName}`);
    const { imageScraper } = await import('./services/image-scraper.js');
    const debugResult = await imageScraper.debugPageStructure(contestant.dragName, contestant.metadataSourceUrl);
    
    res.json({
      contestant: contestant.dragName,
      url: contestant.metadataSourceUrl,
      debug: debugResult
    });
  } catch (error) {
    console.error('[debug] Image debug failed:', error);
    res.status(500).json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Fandom URL lookup endpoint
apiRouter.post("/contestants/:id/lookup-fandom-url", async (req, res) => {
  try {
    const contestantId = req.params.id;
    const contestant = await storage.getContestant(contestantId);
    
    if (!contestant) {
      return res.status(404).json({ error: "Contestant not found" });
    }

    // Only lookup if no metadata source URL exists
    if (contestant.metadataSourceUrl) {
      return res.json({ 
        message: "Contestant already has a metadata source URL",
        contestantId,
        dragName: contestant.dragName,
        currentUrl: contestant.metadataSourceUrl 
      });
    }

    // Import and use fandom lookup
    const { getFandomUrl } = await import('./services/fandom-lookup.js');
    const fandomUrl = await getFandomUrl(contestant.dragName, { headless: true, timeout: 20000 });

    if (fandomUrl) {
      // Update the contestant with the found URL
      const updatedContestant = await storage.updateContestant(contestantId, {
        metadataSourceUrl: fandomUrl
      });

      // If image scraping is enabled, start scraping images automatically
      const { isImageScrapingEnabled } = await import('./config.js');
      if (isImageScrapingEnabled()) {
        console.log(`[api] Image scraping is enabled. Starting image scraping for ${contestant.dragName}`);
        
        try {
          // Import and use image scraper
          const { imageScraper } = await import('./services/image-scraper.js');
          
          // Start image scraping asynchronously (don't block the API response)
          imageScraper.scrapeContestantImages(
            contestant.dragName,
            fandomUrl,
            undefined // Season name not available in this context
          ).then((imageResult) => {
            console.log(`[api] Image scraping completed for ${contestant.dragName}:`, imageResult);
          }).catch((imageError) => {
            console.error(`[api] Image scraping failed for ${contestant.dragName}:`, imageError);
          });
          
        } catch (error) {
          console.error(`[api] Error initializing image scraper for ${contestant.dragName}:`, error);
        }
      } else {
        console.log(`[api] Image scraping is disabled for ${contestant.dragName}`);
      }
      
      res.json({
        success: true,
        message: `Found and updated fandom URL for ${contestant.dragName}${isImageScrapingEnabled() ? '. Image scraping started automatically.' : ''}`,
        contestantId,
        dragName: contestant.dragName,
        fandomUrl,
        contestant: updatedContestant,
        imageScrapingTriggered: isImageScrapingEnabled()
      });
    } else {
      res.json({
        success: false,
        message: `No fandom URL found for ${contestant.dragName}`,
        contestantId,
        dragName: contestant.dragName
      });
    }

  } catch (error) {
    console.error('Error looking up fandom URL:', error);
    res.status(500).json({ 
      error: "Failed to lookup fandom URL",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database reset endpoint (DEV only)
apiRouter.post("/database/reset", async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ 
        error: "Database reset is only allowed in development mode" 
      });
    }

    console.log('[database-reset] Starting database reset...');
    
    // Use storage abstraction for efficient bulk deletion
    await storage.truncateAllTables();

    console.log('[database-reset] Database reset completed successfully');

    res.json({
      success: true,
      message: "Scraped data has been cleared. Scraping jobs history preserved.",
      resetAt: new Date().toISOString(),
      tablesCleared: ['appearances', 'contestants', 'seasons', 'franchises']
    });

  } catch (error) {
    console.error('Database reset error:', error);
    res.status(500).json({ 
      error: "Failed to reset database",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Image scraping endpoint
apiRouter.post("/images/scrape-contestant", async (req, res) => {
  try {
    const { contestantId, contestantName, metadataSourceUrl, seasonName } = req.body;
    
    if (!contestantName || !metadataSourceUrl) {
      return res.status(400).json({ 
        error: "contestantName and metadataSourceUrl are required" 
      });
    }

    const result = await imageScraper.scrapeContestantImages(
      contestantName,
      metadataSourceUrl,
      seasonName
    );

    res.json({
      message: `Image scraping completed for ${contestantName}`,
      result: result
    });
  } catch (error) {
    console.error("Image scraping error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to scrape contestant images" 
    });
  }
});

// Configuration endpoints
apiRouter.get("/config", async (req, res) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

apiRouter.patch("/config", async (req, res) => {
  try {
    const updatedConfig = updateConfig(req.body);
    res.json({
      message: "Configuration updated successfully",
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to update configuration",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

apiRouter.post("/config/reset", async (req, res) => {
  try {
    const defaultConfig = resetConfig();
    res.json({
      message: "Configuration reset to defaults",
      config: defaultConfig
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to reset configuration",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Image scraping toggle endpoint
apiRouter.patch("/config/image-scraping", async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: "enabled must be a boolean value" });
    }
    
    const currentConfig = getConfig();
    const updatedConfig = updateConfig({
      imageScraping: { 
        ...currentConfig.imageScraping,
        enabled 
      }
    });
    
    res.json({
      message: `Image scraping ${enabled ? 'enabled' : 'disabled'}`,
      imageScrapingEnabled: updatedConfig.imageScraping.enabled,
      config: updatedConfig
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to update image scraping setting",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Image endpoint with fallback to presigned URL
apiRouter.get("/images/*", async (req, res) => {
  try {
    // Extract the S3 key from the URL
    let s3Key = (req.params as any)[0]; // Everything after /images/
    
    if (!s3Key) {
      return res.status(400).json({ error: "Image path required" });
    }

    try {
      // Try to generate a presigned URL for the image (expires in 1 hour)
      const presignedUrl = await s3Service.getPresignedUrl(s3Key, 3600);
      console.log(`Generated presigned URL for ${s3Key}`);
      
      // Redirect to the presigned URL - browser will handle the image display
      res.redirect(presignedUrl);
    } catch (presignedError) {
      console.error('Presigned URL generation failed:', presignedError);
      
      // Fallback: Return a temporary placeholder image for testing
      const placeholderPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x32, 0x00, 0x00, 0x00, 0x32, // 50x50 pixel
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1E, 0x3F, 0x88, // RGBA, CRC
        0xB1, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0x1D, 0x01, 0x00, 0x00, 0x00, 0x00, // compressed data
        0x00, 0x05, 0x57, 0x72, 0x9C, 0x00, 0x00, 0x00, // end of IDAT
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
      ]);

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': placeholderPng.length.toString(),
        'Cache-Control': 'no-cache', // Don't cache fallback images
      });
      
      res.send(placeholderPng);
    }
    
  } catch (error) {
    console.error('Image endpoint error:', error);
    res.status(500).json({ error: "Failed to load image" });
  }
});


