import { chromium, Browser, Page } from "playwright";
import { storage } from "../storage";
import { broadcastProgress } from "./websocket.js";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface ScrapingOptions {
  headless?: boolean;
  screenshotsEnabled?: boolean;
  maxConcurrency?: number;
}

export class RuPaulScraper {
  private browser: Browser | null = null;
  private currentJobId: string | null = null;
  private screenshotDir: string;

  constructor() {
    this.screenshotDir = path.join(process.cwd(), "screenshots");
  }

  async initialize(options: ScrapingOptions = {}) {
    try {
      this.browser = await chromium.launch({
        headless: options.headless ?? true, // Default to headless mode for better compatibility
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
      });

      // Ensure screenshot directory exists
      try {
        await fs.mkdir(this.screenshotDir, { recursive: true });
      } catch (error) {
        console.log("Screenshot directory already exists or couldn't be created");
      }
    } catch (error) {
      throw new Error(`Failed to initialize browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async startScraping(options: ScrapingOptions = {}): Promise<string> {
    if (this.currentJobId) {
      throw new Error("Scraping job already in progress");
    }

    const job = await storage.createScrapingJob({
      status: "running",
      progress: 0,
      totalItems: 0,
      startedAt: new Date(),
    });

    this.currentJobId = job.id;

    try {
      await this.initialize(options);
      await this.scrapeWikipediaDragRaceData(job.id, options);
      
      await storage.updateScrapingJob(job.id, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      });

      broadcastProgress({
        jobId: job.id,
        status: "completed",
        progress: 100,
        totalItems: 0,
        message: "Scraping completed successfully!",
      });

    } catch (error) {
      await storage.updateScrapingJob(job.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      });

      broadcastProgress({
        jobId: job.id,
        status: "failed",
        progress: 0,
        totalItems: 0,
        message: `Scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });

      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.currentJobId = null;
    }

    return job.id;
  }

  private async scrapeWikipediaDragRaceData(jobId: string, options: ScrapingOptions) {
    if (!this.browser) throw new Error("Browser not initialized");

    const page = await this.browser.newPage();
    
    try {
      // Define seasons to scrape
      const seasonsToScrape = [
        { name: "Season 16", franchise: "US", year: 2024, url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_16)" },
        { name: "Season 15", franchise: "US", year: 2023, url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_15)" },
        { name: "Season 14", franchise: "US", year: 2022, url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_14)" },
        { name: "UK Season 5", franchise: "UK", year: 2023, url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_UK_(series_5)" },
        { name: "UK Season 4", franchise: "UK", year: 2022, url: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_UK_(series_4)" },
      ];

      await storage.updateScrapingJob(jobId, {
        totalItems: seasonsToScrape.length,
        progress: 0,
      });

      for (let i = 0; i < seasonsToScrape.length; i++) {
        const seasonData = seasonsToScrape[i];
        
        await storage.updateScrapingJob(jobId, {
          currentItem: `Scraping ${seasonData.name}`,
          progress: Math.round((i / seasonsToScrape.length) * 100),
        });

        broadcastProgress({
          jobId,
          status: "running",
          progress: Math.round((i / seasonsToScrape.length) * 100),
          totalItems: seasonsToScrape.length,
          currentItem: `Scraping ${seasonData.name}`,
          message: `Processing ${seasonData.name}...`,
        });

        // Create or update season record
        await storage.createSeason({
          name: seasonData.name,
          franchise: seasonData.franchise,
          year: seasonData.year,
          wikipediaUrl: seasonData.url,
          isScraped: true,
        });

        await this.scrapeSeason(page, seasonData, options.screenshotsEnabled ?? false);
        
        // Wait between requests to be respectful to Wikipedia
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } finally {
      await page.close();
    }
  }

  private async scrapeSeason(page: Page, seasonData: any, screenshotsEnabled: boolean) {
    try {
      await page.goto(seasonData.url, { waitUntil: 'networkidle' });
      
      if (screenshotsEnabled) {
        const screenshotPath = await this.takeScreenshot(page, `${seasonData.name.replace(/\s+/g, '_')}_page`);
        broadcastProgress({
          jobId: this.currentJobId!,
          status: "running",
          progress: 0,
          totalItems: 0,
          screenshot: screenshotPath,
          message: `Loaded ${seasonData.name} Wikipedia page`,
        });
      }

      // Look for contestant tables - Wikipedia typically has tables with contestant information
      const contestantRows = await page.locator('table.wikitable tr').all();
      
      for (let i = 1; i < contestantRows.length; i++) { // Skip header row
        const row = contestantRows[i];
        const cells = await row.locator('td').all();
        
        if (cells.length < 3) continue; // Skip if not enough data
        
        try {
          // Extract contestant data from table cells
          // This is a basic implementation - real Wikipedia scraping would need more sophisticated parsing
          const dragName = await cells[0]?.textContent() || "";
          const realName = await cells[1]?.textContent() || "";
          const hometown = cells.length > 2 ? await cells[2]?.textContent() || "" : "";
          const age = cells.length > 3 ? this.extractAge(await cells[3]?.textContent() || "") : null;
          
          if (dragName.trim() && dragName !== "Contestant") {
            // Check if contestant already exists to avoid duplicates
            const existingContestants = await storage.getContestantsBySearch(dragName.trim());
            const exists = existingContestants.some(c => 
              c.dragName === dragName.trim() && c.season === seasonData.name
            );
            
            if (!exists) {
              await storage.createContestant({
                dragName: dragName.trim(),
                realName: realName.trim() || undefined,
                hometown: hometown.trim() || undefined,
                age: age,
                season: seasonData.name,
                franchise: seasonData.franchise,
                outcome: this.extractOutcome(await cells[cells.length - 1]?.textContent() || ""),
                wikipediaUrl: seasonData.url,
                isScraped: true,
              });
            }
          }
        } catch (error) {
          console.error(`Error processing contestant row ${i}:`, error);
          continue;
        }
      }

    } catch (error) {
      console.error(`Error scraping season ${seasonData.name}:`, error);
      throw error;
    }
  }

  private async takeScreenshot(page: Page, name: string): Promise<string> {
    const filename = `${Date.now()}_${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: true,
    });
    
    return `/screenshots/${filename}`;
  }

  private extractAge(text: string): number | null {
    const ageMatch = text.match(/\b(\d{2})\b/);
    return ageMatch ? parseInt(ageMatch[1]) : null;
  }

  private extractOutcome(text: string): string | undefined {
    const outcome = text.toLowerCase().trim();
    if (outcome.includes("winner") || outcome.includes("win")) return "Winner";
    if (outcome.includes("runner-up") || outcome.includes("runner up")) return "Runner-up";
    if (outcome.includes("eliminated") || outcome.includes("elim")) return "Eliminated";
    if (outcome.includes("disqualified") || outcome.includes("disq")) return "Disqualified";
    return outcome || undefined;
  }

  async stopScraping(): Promise<void> {
    if (this.currentJobId) {
      await storage.updateScrapingJob(this.currentJobId, {
        status: "failed",
        errorMessage: "Stopped by user",
        completedAt: new Date(),
      });
      this.currentJobId = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getCurrentJobId(): string | null {
    return this.currentJobId;
  }
}

// For now, use mock scraper to demonstrate functionality
import { MockRuPaulScraper } from "./mock-scraper";
export const scraper = new MockRuPaulScraper();
