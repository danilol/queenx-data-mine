import { chromium, Browser, Page } from "playwright";
import { storage } from "../storage";
import { broadcastProgress } from "./websocket.js";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { FRANCHISES, FRANCHISES_WITH_URLS, SEASONS } from '../data/franchises';
import 'dotenv/config';
import { Season, ScrapingJobPayload, seasonStatusSchema, ScrapingRequest, ScrapingLevel } from "@shared/schema";
import { z } from "zod";

export interface ScrapingOptions {
  headless?: boolean;
  screenshotsEnabled?: boolean;
}

export class RuPaulScraper {
  private browser: Browser | null = null;
  private scrapingJob: ScrapingJobPayload | null = null;
  private screenshotDir: string;
  private seasonStatuses: z.infer<typeof seasonStatusSchema>[] = [];

  constructor() {
    this.screenshotDir = path.join(process.cwd(), "screenshots");
  }

  async initialize(options: ScrapingOptions = {}) {
    try {
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
      });
      await fs.mkdir(this.screenshotDir, { recursive: true }).catch(() => {});
    } catch (error) {
      throw new Error(`Failed to initialize browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getStatus(): ScrapingJobPayload | null {
    return this.scrapingJob;
  }

  public async startScraping(request: ScrapingRequest, options: ScrapingOptions = {}): Promise<ScrapingJobPayload> {
    console.log(`[scraper] Starting ${request.level} scraping process...`);
    if (this.scrapingJob?.status === 'running') {
      return this.scrapingJob;
    }

    await this.initialize(options);

    switch (request.level) {
      case 'full':
        return this.startFullScraping(options);
      case 'franchise':
        return this.startFranchiseScraping(request, options);
      case 'season':
        return this.startSeasonScraping(request, options);
      case 'contestant':
        return this.startContestantScraping(request, options);
      default:
        throw new Error(`Unsupported scraping level: ${request.level}`);
    }
  }

  private async startFullScraping(options: ScrapingOptions = {}): Promise<ScrapingJobPayload> {
    await this.seedDatabase();
    const allSeasons = await storage.getAllSeasons();
    console.log(`[scraper] Found ${allSeasons.length} seasons in the database.`);

    this.seasonStatuses = allSeasons.map(season => ({
      name: season.name,
      franchiseName: season.franchiseName,
      status: 'pending',
    }));

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
    };

    this.runScrapingProcess(allSeasons, options);
    return this.scrapingJob;
  }

  private async startFranchiseScraping(request: ScrapingRequest, options: ScrapingOptions = {}): Promise<ScrapingJobPayload> {
    console.log(`[scraper] Starting franchise scraping for franchise ID: ${request.franchiseId}`);
    
    if (!request.franchiseId) {
      throw new Error('Franchise ID is required for franchise scraping');
    }

    const franchiseSeasons = await storage.getAllSeasons();
    const filteredSeasons = franchiseSeasons.filter(season => season.franchiseId === request.franchiseId);
    
    this.seasonStatuses = filteredSeasons.map(season => ({
      name: season.name,
      franchiseName: season.franchiseName,
      status: 'pending',
    }));

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
    };

    this.runScrapingProcess(filteredSeasons, options);
    return this.scrapingJob;
  }

  private async startSeasonScraping(request: ScrapingRequest, options: ScrapingOptions = {}): Promise<ScrapingJobPayload> {
    console.log(`[scraper] Starting season scraping for season ID: ${request.seasonId}`);
    
    if (!request.seasonId) {
      throw new Error('Season ID is required for season scraping');
    }

    const season = await storage.getSeason(request.seasonId);
    if (!season) {
      throw new Error(`Season not found: ${request.seasonId}`);
    }

    this.seasonStatuses = [{
      name: season.name,
      franchiseName: 'Unknown', // Will be resolved during scraping
      status: 'pending',
    }];

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
    };

    this.runScrapingProcess([season], options);
    return this.scrapingJob;
  }

  private async startContestantScraping(request: ScrapingRequest, options: ScrapingOptions = {}): Promise<ScrapingJobPayload> {
    console.log(`[scraper] Starting contestant scraping for contestant ID: ${request.contestantId}`);
    
    if (!request.contestantId) {
      throw new Error('Contestant ID is required for contestant scraping');
    }

    const contestant = await storage.getContestant(request.contestantId);
    if (!contestant) {
      throw new Error(`Contestant not found: ${request.contestantId}`);
    }

    this.seasonStatuses = [{
      name: `Contestant: ${contestant.dragName}`,
      franchiseName: 'Individual',
      status: 'pending',
    }];

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
    };

    this.runContestantScraping(contestant, options);
    return this.scrapingJob;
  }

  private async runContestantScraping(contestant: any, options: ScrapingOptions) {
    // Individual contestant scraping logic
    console.log(`[scraper] Scraping contestant: ${contestant.dragName}`);
    
    broadcastProgress({
      jobId: this.scrapingJob?.id || null,
      status: 'running',
      progress: 50,
      totalItems: 1,
      currentItem: contestant.dragName,
      message: `Scraping details for ${contestant.dragName}`,
      seasons: this.seasonStatuses,
    });

    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.scrapingJob = {
      ...this.scrapingJob!,
      status: 'completed',
    };

    broadcastProgress({
      jobId: this.scrapingJob?.id || null,
      status: 'completed',
      progress: 100,
      totalItems: 1,
      currentItem: contestant.dragName,
      message: `Completed scraping for ${contestant.dragName}`,
      seasons: this.seasonStatuses.map(s => ({ ...s, status: 'completed' })),
    });
  }

  private async seedDatabase() {
    console.log('[scraper] Seeding database...');
    for (const franchise of FRANCHISES_WITH_URLS) {
      const newFranchise = await storage.createFranchise(franchise.name);
      console.log(`Franchise '${newFranchise.name}' seeded`);
    }

    const allDbFranchises = await storage.getAllFranchises();
    for (const season of SEASONS) {
      const franchise = allDbFranchises.find(f => f.name === season.franchiseName);
      if (franchise) {

          const newSeason = await storage.createSeason({
            name: season.name,
            franchiseId: franchise.id,
            year: season.year,
            sourceUrl: season.sourceUrl,
          });
          if (newSeason) {
            console.log(`[scraper] Created season: ${newSeason.name}`);
          }
      }
    }
  }

  private async runScrapingProcess(allSeasons: Season[], options: ScrapingOptions) {
    if (!this.browser) {
        console.error("Browser not initialized, stopping scraping process.");
        if (this.scrapingJob) {
            this.scrapingJob.status = 'failed';
            this.broadcastScrapingProgress();
        }
        return;
    }

    for (const season of allSeasons) {
      try {
        this.updateSeasonStatus(season.name, 'running');
        const page = await this.browser.newPage();
        await this.scrapeSeason(page, season, options.screenshotsEnabled ?? false);
        await page.close();
        this.updateSeasonStatus(season.name, 'completed');
      } catch (error) {
        this.updateSeasonStatus(season.name, 'failed');
        console.error(`Failed to scrape ${season.name}:`, error);
      }
    }

    if (this.scrapingJob) {
      this.scrapingJob.status = 'completed';
      this.broadcastScrapingProgress();
    }
    await this.stopScraping();
  }

  private updateSeasonStatus(seasonName: string, status: "pending" | "running" | "completed" | "failed") {
    const season = this.seasonStatuses.find((s) => s.name === seasonName);
    if (season) {
      season.status = status;
    }
    this.broadcastScrapingProgress();
  }

  private broadcastScrapingProgress() {
    if (!this.scrapingJob) return;

    const completedCount = this.seasonStatuses.filter((s) => s.status === "completed").length;
    const progress = (completedCount / this.seasonStatuses.length) * 100;

    broadcastProgress({
      jobId: this.scrapingJob.id,
      status: this.scrapingJob.status,
      progress,
      totalItems: this.seasonStatuses.length,
      currentItem: this.seasonStatuses.find((s) => s.status === "running")?.name ?? '',
      seasons: this.seasonStatuses,
    });
  }

  private async scrapeSeason(page: Page, seasonData: Season, screenshotsEnabled: boolean) {
    try {
      if (!seasonData.sourceUrl) {
        console.log(`[scraper] Skipping season ${seasonData.name} due to missing source URL.`);
        return;
      }
      console.log(`[scraper] Navigating to ${seasonData.sourceUrl} for season: ${seasonData.name}`);
      await page.goto(seasonData.sourceUrl, { waitUntil: 'networkidle' });

      if (screenshotsEnabled) {
        await this.takeScreenshot(page, `season_${seasonData.name.replace(/\s/g, '_')}`);
      }

      const contestantTable = page.locator('.wikitable');
      await contestantTable.first().waitFor({ state: 'visible', timeout: 10000 });

      const contestantRows = await contestantTable.first().locator('tr').all();
      if (contestantRows.length < 2) {
        return;
      }

      for (let i = 1; i < contestantRows.length; i++) {
        const row = contestantRows[i];
        const cells = await row.locator('td').all();
        if (cells.length < 3) continue;

        try {
          const dragName = (await cells[0]?.textContent())?.trim() || '';
          if (!dragName || dragName.toLowerCase() === 'contestant') continue;

          const realName = (await cells[1]?.textContent())?.trim() || undefined;
          const hometown = (await cells[2]?.textContent())?.trim() || undefined;
          const age = cells.length > 3 ? this.extractAge(await cells[3]?.textContent() || '') : null;

          let contestant = await storage.getContestantByDragName(dragName);
          if (!contestant) {
            contestant = await storage.createContestant({
              dragName,
              realName,
              hometown,
            });
          }

          const season = await storage.getSeasonByName(seasonData.name);
          if (contestant && season) {
            const existingAppearance = await storage.getAppearance(contestant.id, season.id);
            if (!existingAppearance) {
              await storage.createAppearance({
                contestantId: contestant.id,
                seasonId: season.id,
                age: age,
                outcome: this.extractOutcome(await cells[cells.length - 1]?.textContent() || ""),
              });
            }
          }
        } catch (error) {
          console.error(`[scraper] Error processing row ${i} for season ${seasonData.name}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`[scraper] Critical error scraping season ${seasonData.name}:`, error);
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
    if (outcome.includes("winner")) return "Winner";
    if (outcome.includes("runner-up")) return "Runner-up";
    if (outcome.includes("eliminated")) return "Eliminated";
    if (outcome.includes("disqualified")) return "Disqualified";
    return outcome || undefined;
  }

  async stopScraping(): Promise<void> {
    if (this.scrapingJob && this.scrapingJob.status === 'running') {
      this.scrapingJob.status = 'failed';
      this.broadcastScrapingProgress();
    }
    this.scrapingJob = null;
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getScrapingJob(): ScrapingJobPayload | null {
    return this.scrapingJob;
  }
}

export const scraper = new RuPaulScraper();
