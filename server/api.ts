import { Router } from "express";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { mockScraper } from "./services/mock-scraper";
import { exporter } from "./services/exporter";

export const apiRouter = Router();

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


