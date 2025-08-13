import { Router } from "express";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { mockScraper } from "./services/mock-scraper";

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

apiRouter.get("/franchises", async (req, res) => {
  try {
    const franchises = await storage.getAllFranchises();
    res.json(franchises);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch franchises" });
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


