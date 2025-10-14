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
import { isImageScrapingEnabled, getConfig } from "../config";
import { getScrapingConfig, ColumnConfig } from "../scraping-configs/index";

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
        executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
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
    const allFranchises = await storage.getAllFranchises();
    console.log(`[scraper] Found ${allSeasons.length} seasons across ${allFranchises.length} franchises.`);

    // Build hierarchical franchise structure
    const franchiseStatuses = allFranchises.map(franchise => ({
      name: franchise.name,
      status: 'pending' as const,
      progress: 0,
      seasons: allSeasons
        .filter(season => season.franchiseName === franchise.name)
        .map(season => ({
          name: season.name,
          franchiseName: season.franchiseName,
          status: 'pending' as const,
          progress: 0,
          contestants: [] // Will be populated when scraping starts
        }))
    }));

    this.seasonStatuses = allSeasons.map(season => ({
      name: season.name,
      franchiseName: season.franchiseName,
      status: 'pending' as const,
      progress: 0
    }));

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
      franchises: franchiseStatuses
    };

    broadcastProgress({
      jobId: this.scrapingJob.id,
      status: 'running',
      progress: 0,
      totalItems: allSeasons.length,
      message: `Starting full scraping of ${allSeasons.length} seasons across ${allFranchises.length} franchises`,
      seasons: this.seasonStatuses,
      franchises: franchiseStatuses
    });

    // Process seasons asynchronously
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
      status: 'pending' as const,
      progress: 0
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

    const franchiseName = season.franchise?.name || 'Unknown';
    const seasonWithFranchiseName = { ...season, franchiseName };

    this.seasonStatuses = [{
      name: season.name,
      franchiseName,
      status: 'pending' as const,
      progress: 0
    }];

    this.scrapingJob = {
      id: randomUUID(),
      status: 'running',
      seasons: this.seasonStatuses,
    };

    this.runScrapingProcess([seasonWithFranchiseName], options);
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
      status: 'pending' as const,
      progress: 0
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
    console.log(`[scraper] Scraping contestant: ${contestant.dragName}`);
    this.updateSeasonStatus(`Contestant: ${contestant.dragName}`, 'running');

    try {
      // Skip URL checking since metadata_source_url already exists and was verified when saved
      if (contestant.metadataSourceUrl) {
        // Trigger image scraping for the contestant (no need to check URL again)
        if (isImageScrapingEnabled()) {
          console.log(`[scraper] Triggering image scraping for ${contestant.dragName}`);
          const { imageScraper } = await import('./image-scraper.js');
          imageScraper.scrapeContestantImages(
            contestant.dragName,
            contestant.metadataSourceUrl
          ).catch(err => {
            console.error(`[scraper] Image scraping failed for ${contestant.dragName}:`, err);
            this.updateSeasonStatus(`Contestant: ${contestant.dragName}`, 'failed');
            return;
          });
        } else {
          console.log(`[scraper] Image scraping disabled for ${contestant.dragName}`);
        }
      } else {
        console.log(`[scraper] No metadata source URL for ${contestant.dragName}, skipping`);
      }
      this.updateSeasonStatus(`Contestant: ${contestant.dragName}`, 'completed');
    } catch (error) {
      this.updateSeasonStatus(`Contestant: ${contestant.dragName}`, 'failed');
      console.error(`Failed to scrape ${contestant.dragName}:`, error);
    }

    if (this.scrapingJob) {
      this.scrapingJob.status = 'completed';
      this.broadcastScrapingProgress();
    }
    await this.stopScraping();
  }

  private async seedDatabase() {
    console.log('[scraper] Seeding database...');
    for (const franchise of FRANCHISES_WITH_URLS) {
      const newFranchise = await storage.createFranchise({
        name: franchise.name,
        metadataSourceUrl: franchise.metadataSourceUrl
      });
      console.log(`Franchise '${newFranchise.name}' seeded with source URL: ${newFranchise.metadataSourceUrl}`);
    }

    const allDbFranchises = await storage.getAllFranchises();
    for (const season of SEASONS) {
      const franchise = allDbFranchises.find(f => f.name === season.franchiseName);
      if (franchise) {

          const newSeason = await storage.createSeason({
            name: season.name,
            franchiseId: franchise.id,
            year: season.year,
            metadataSourceUrl: season.metadataSourceUrl,
          });
          if (newSeason) {
            console.log(`[scraper] Created season: ${newSeason.name}`);
          }
      }
    }
  }

  private async runScrapingProcess(allSeasons: (Season & { franchiseName: string })[], options: ScrapingOptions) {
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

  private async extractCellValue(row: any, columnConfig: ColumnConfig): Promise<string> {
    const cells = await row.locator(columnConfig.cellType).all();
    const index = columnConfig.index < 0 ? cells.length + columnConfig.index : columnConfig.index;
    
    if (index < 0 || index >= cells.length) {
      return '';
    }

    const cell = cells[index];
    let value = '';
    
    if (columnConfig.selector) {
      const element = cell.locator(columnConfig.selector);
      value = (await element.textContent())?.trim() || '';
    } else {
      value = (await cell.textContent())?.trim() || '';
    }

    // Apply parser
    if (columnConfig.parser === 'trim') {
      return value.trim();
    } else if (columnConfig.parser === 'extractAge') {
      const age = this.extractAge(value);
      return age !== null ? age.toString() : '';
    } else if (columnConfig.parser === 'extractOutcome') {
      return this.extractOutcome(value) || '';
    }

    return value;
  }

  private async scrapeContestantFromRow(row: any, seasonData: Season & { franchiseName: string }, franchiseName: string) {
    console.log(`[scraper] Processing a contestant row for season: ${seasonData.name}`);
    
    const config = getScrapingConfig(franchiseName);
    if (!config.season?.contestantTable) {
      console.error(`[scraper] No contestant table config for franchise: ${franchiseName}`);
      return;
    }

    const tableConfig = config.season.contestantTable;

    try {
      // Extract data using configuration
      const dragName = await this.extractCellValue(row, tableConfig.columns.dragName);
      if (!dragName || dragName.toLowerCase() === 'contestant') return;

      const age = tableConfig.columns.age 
        ? parseInt(await this.extractCellValue(row, tableConfig.columns.age)) || null
        : null;
      
      const hometown = tableConfig.columns.hometown 
        ? (await this.extractCellValue(row, tableConfig.columns.hometown)) || undefined
        : undefined;
      
      const realName = tableConfig.columns.realName 
        ? (await this.extractCellValue(row, tableConfig.columns.realName)) || undefined
        : undefined;

      const outcome = tableConfig.columns.outcome 
        ? (await this.extractCellValue(row, tableConfig.columns.outcome)) || undefined
        : undefined;

      console.log(`[scraper] Extracted data - Name: ${dragName}, Age: ${age}, Hometown: ${hometown}, Real Name: ${realName}, Outcome: ${outcome}`);

      let contestant = await storage.getContestantByDragName(dragName);
      if (!contestant) {
        console.log(`[scraper] Creating new contestant: ${dragName}`);
        contestant = await storage.createContestantWithFandomUrl({
          dragName,
          realName,
          hometown,
          // Don't set metadataSourceUrl here - let createContestantWithFandomUrl find the fandom URL
        });
      } else {
        console.log(`[scraper] Contestant ${dragName} already exists.`);
        // If existing contestant has no URL, try to find it.
        if (!contestant.metadataSourceUrl) {
          console.log(`[scraper] Existing contestant ${dragName} is missing a Fandom URL. Attempting lookup...`);
          const { getFandomUrl } = await import('./fandom-lookup.js');
          const fandomUrl = await getFandomUrl(dragName, { headless: true, timeout: 20000 });
          if (fandomUrl) {
            contestant = await storage.updateContestant(contestant.id, { metadataSourceUrl: fandomUrl }) || contestant;
            console.log(`[scraper] Found and updated Fandom URL for ${dragName}: ${fandomUrl}`);
          }
        }
      }

      const season = await storage.getSeasonByName(seasonData.name);
      if (contestant && season) {
        const existingAppearance = await storage.getAppearance(contestant.id, season.id);
        if (!existingAppearance) {
          await storage.createAppearance({
            contestantId: contestant.id,
            seasonId: season.id,
            age: age,
            outcome: outcome,
          });
        }

        // After creating or finding a contestant, trigger image scraping if enabled
        if (isImageScrapingEnabled() && contestant.metadataSourceUrl) {
          console.log(`[scraper] Triggering image scraping for ${contestant.dragName}`);
          const { imageScraper } = await import('./image-scraper.js');
          imageScraper.scrapeContestantImages(
            contestant.dragName,
            contestant.metadataSourceUrl,
            season.name
          ).catch(err => {
            console.error(`[scraper] Image scraping failed for ${contestant.dragName}:`, err);
          });
        }
      }
    } catch (error) {
      console.error(`[scraper] Error processing row for season ${seasonData.name}:`, error);
    }
  }

  private async scrapeTableWithConfig(
    page: Page, 
    seasonData: Season & { franchiseName: string }, 
    franchiseName: string,
    tableConfig: any,
    configName: string
  ): Promise<number> {
    try {
      console.log(`[scraper] Trying ${configName} table config with selector: ${tableConfig.tableSelector}`);
      
      const contestantTable = page.locator(tableConfig.tableSelector);
      const tableCount = await contestantTable.count();
      
      if (tableCount === 0) {
        console.log(`[scraper] No tables found with selector: ${tableConfig.tableSelector}`);
        return 0;
      }

      await contestantTable.first().waitFor({ state: 'visible', timeout: 10000 });

      const rowSelector = tableConfig.rowSelector || 'tr';
      const contestantRows = await contestantTable.first().locator(rowSelector).all();
      
      if (contestantRows.length < 2) {
        console.log(`[scraper] Not enough rows found (${contestantRows.length}) in ${configName} table`);
        return 0;
      }

      const startIndex = tableConfig.skipFirstRow ? 1 : 0;
      let scrapedCount = 0;
      
      for (let i = startIndex; i < contestantRows.length; i++) {
        const row = contestantRows[i];
        await this.scrapeContestantFromRow(row, seasonData, franchiseName);
        scrapedCount++;
      }
      
      console.log(`[scraper] Successfully scraped ${scrapedCount} contestants using ${configName} config`);
      return scrapedCount;
    } catch (error) {
      console.log(`[scraper] Error with ${configName} config: ${error}`);
      return 0;
    }
  }

  private async scrapeSeason(page: Page, seasonData: Season & { franchiseName: string }, screenshotsEnabled: boolean) {
    try {
      if (!seasonData.metadataSourceUrl) {
        console.log(`[scraper] Skipping season ${seasonData.name} due to missing source URL.`);
        return;
      }

      // Get franchise name for this season
      const franchiseName = seasonData.franchiseName;
      const config = getScrapingConfig(franchiseName);
      
      console.log(`[scraper] Navigating to ${seasonData.metadataSourceUrl} for season: ${seasonData.name} (Franchise: ${franchiseName})`);
      await page.goto(seasonData.metadataSourceUrl, { waitUntil: 'networkidle' });

      if (screenshotsEnabled) {
        await this.takeScreenshot(page, `season_${seasonData.name.replace(/\s/g, '_')}`);
      }

      if (!config.season?.contestantTable) {
        console.error(`[scraper] No contestant table configuration for franchise: ${franchiseName}`);
        return;
      }

      // Try primary table configuration first
      let scrapedCount = await this.scrapeTableWithConfig(
        page, 
        seasonData, 
        franchiseName, 
        config.season.contestantTable,
        'primary'
      );

      // If primary config didn't find contestants, try alternative configs
      if (scrapedCount === 0 && config.season.alternativeTables && config.season.alternativeTables.length > 0) {
        console.log(`[scraper] Primary config found no contestants, trying ${config.season.alternativeTables.length} alternative config(s)`);
        
        for (let i = 0; i < config.season.alternativeTables.length; i++) {
          const altConfig = config.season.alternativeTables[i];
          scrapedCount = await this.scrapeTableWithConfig(
            page,
            seasonData,
            franchiseName,
            altConfig,
            `alternative #${i + 1}`
          );
          
          if (scrapedCount > 0) {
            console.log(`[scraper] Successfully used alternative config #${i + 1}`);
            break;
          }
        }
      }

      if (scrapedCount === 0) {
        console.warn(`[scraper] No contestants found for season ${seasonData.name} with any configuration`);
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
