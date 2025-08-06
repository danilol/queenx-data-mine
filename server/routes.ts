import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { setupWebSocketServer } from "./services/websocket";
import { insertContestantSchema, updateContestantSchema } from "@shared/schema";
import express from "express";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer);

  // Serve screenshots
  app.use('/screenshots', express.static(path.join(process.cwd(), 'screenshots')));

  // API Routes
  
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getAppStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Contestants endpoints
  app.get("/api/contestants", async (req, res) => {
    try {
      const { search, limit } = req.query;
      let contestants;

      if (search) {
        contestants = await storage.getContestantsBySearch(search as string);
      } else if (limit) {
        contestants = await storage.getRecentContestants(parseInt(limit as string));
      } else {
        contestants = await storage.getContestants();
      }

      res.json(contestants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contestants" });
    }
  });

  app.get("/api/contestants/:id", async (req, res) => {
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

  app.post("/api/contestants", async (req, res) => {
    try {
      const validatedData = insertContestantSchema.parse(req.body);
      const contestant = await storage.createContestant(validatedData);
      res.status(201).json(contestant);
    } catch (error) {
      res.status(400).json({ error: "Invalid contestant data" });
    }
  });

  app.patch("/api/contestants/:id", async (req, res) => {
    try {
      const validatedData = updateContestantSchema.parse(req.body);
      const contestant = await storage.updateContestant(req.params.id, validatedData);
      if (!contestant) {
        return res.status(404).json({ error: "Contestant not found" });
      }
      res.json(contestant);
    } catch (error) {
      res.status(400).json({ error: "Invalid contestant data" });
    }
  });

  app.delete("/api/contestants/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContestant(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contestant not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contestant" });
    }
  });

  // Seasons endpoints
  app.get("/api/seasons", async (req, res) => {
    try {
      const seasons = await storage.getSeasons();
      res.json(seasons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  // Scraping endpoints
  app.get("/api/scraping/status", async (req, res) => {
    try {
      const activeJob = await storage.getActiveScrapingJob();
      res.json(activeJob || { status: "idle" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scraping status" });
    }
  });

  app.post("/api/scraping/start", async (req, res) => {
    try {
      const { headless = false, screenshotsEnabled = true } = req.body;
      const jobId = await scraper.startScraping({ headless, screenshotsEnabled });
      res.json({ jobId, message: "Scraping started" });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to start scraping" 
      });
    }
  });

  app.post("/api/scraping/stop", async (req, res) => {
    try {
      await scraper.stopScraping();
      res.json({ message: "Scraping stopped" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop scraping" });
    }
  });

  app.get("/api/scraping/jobs", async (req, res) => {
    try {
      const jobs = await storage.getScrapingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scraping jobs" });
    }
  });

  // Export endpoints
  app.get("/api/export/csv", async (req, res) => {
    try {
      const contestants = await storage.getContestants();
      
      if (contestants.length === 0) {
        return res.status(404).json({ error: "No data to export" });
      }

      const headers = [
        "ID", "Drag Name", "Real Name", "Age", "Hometown", 
        "Season", "Franchise", "Outcome", "Biography", "Photo URL", "Wikipedia URL"
      ];

      const csvRows = [
        headers.join(","),
        ...contestants.map(contestant => [
          contestant.id,
          `"${contestant.dragName.replace(/"/g, '""')}"`,
          `"${(contestant.realName || "").replace(/"/g, '""')}"`,
          contestant.age || "",
          `"${(contestant.hometown || "").replace(/"/g, '""')}"`,
          `"${contestant.season}"`,
          `"${contestant.franchise}"`,
          `"${(contestant.outcome || "").replace(/"/g, '""')}"`,
          `"${(contestant.biography || "").replace(/"/g, '""')}"`,
          `"${(contestant.photoUrl || "").replace(/"/g, '""')}"`,
          `"${(contestant.wikipediaUrl || "").replace(/"/g, '""')}"`,
        ].join(","))
      ];

      const csvContent = csvRows.join("\n");
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="drag_race_contestants_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  app.get("/api/export/json", async (req, res) => {
    try {
      const contestants = await storage.getContestants();
      const seasons = await storage.getSeasons();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        contestants,
        seasons,
        totalContestants: contestants.length,
        totalSeasons: seasons.length,
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="drag_race_data_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export JSON" });
    }
  });

  return httpServer;
}
