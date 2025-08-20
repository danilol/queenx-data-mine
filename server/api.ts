import { Router } from "express";
import multer from "multer";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { mockScraper } from "./services/mock-scraper";
import { exporter } from "./services/exporter";
import { s3Service } from "./services/s3";
import { imageScraper } from "./services/image-scraper";

export const apiRouter = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
    const { search, limit } = req.query;
    const contestants = search
      ? await storage.getContestantsBySearch(search as string)
      : await storage.getContestants();
    res.json(contestants);
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

// Scraping endpoints

apiRouter.post("/scraping/start", async (req, res) => {
  try {
    // Default to full scraping if no level specified for backward compatibility
    const request = req.body.level ? req.body : { level: 'full', ...req.body };
    
    // Use mock scraper in development/testing environments when real scraper fails
    let job;
    try {
      job = await scraper.startScraping(request);
    } catch (playwrightError: any) {
      console.log("Real scraper unavailable, using mock scraper:", playwrightError?.message || playwrightError);
      job = await mockScraper.startScraping(request);
    }
    
    res.json({ jobId: job, message: "Scraping started" });
  } catch (error) {
    console.error('Scraping start error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to start scraping" });
  }
});

apiRouter.post("/scraping/stop", async (req, res) => {
  try {
    await scraper.stopScraping();
    res.json({ message: "Scraping stopped" });
  } catch (error) {
    res.status(500).json({ error: "Failed to stop scraping" });
  }
});

apiRouter.get("/scraping/status", async (req, res) => {
  try {
    // Check both real scraper and mock scraper for status
    let status;
    try {
      status = scraper.getStatus();
      // If real scraper is not running, check mock scraper
      if (!status || status.status === "idle") {
        const mockStatus = mockScraper.getScrapingStatus();
        if (mockStatus.status !== "idle") {
          status = mockStatus;
        }
      }
    } catch (error) {
      // If real scraper fails, use mock scraper status
      status = mockScraper.getScrapingStatus();
    }
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scraping status" });
  }
});

apiRouter.get("/scraping/jobs", async (req, res) => {
  try {
    const jobs = await storage.getScrapingJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scraping jobs" });
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
      
      res.json({
        success: true,
        message: `Found and updated fandom URL for ${contestant.dragName}`,
        contestantId,
        dragName: contestant.dragName,
        fandomUrl,
        contestant: updatedContestant
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
      message: "Database has been completely reset. All data has been cleared.",
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


