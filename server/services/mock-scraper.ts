import { storage } from "../storage";
import { broadcastProgress } from "./websocket.js";
import { randomUUID } from "crypto";

export interface MockScrapingOptions {
  headless?: boolean;
  screenshotsEnabled?: boolean;
  maxConcurrency?: number;
}

// Sample drag race data to simulate scraping results
const SAMPLE_CONTESTANTS = [
  {
    dragName: "RuPaul",
    realName: "RuPaul Andre Charles",
    age: 63,
    hometown: "San Diego, California",
    season: "All Stars Host",
    franchise: "US",
    outcome: "Host",
    biography: "RuPaul Andre Charles is an American drag queen, television judge, musician, and model. RuPaul has produced, hosted, and judged the reality competition series RuPaul's Drag Race since 2009.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/RuPaul_by_Greg_Hernandez_2.jpg/220px-RuPaul_by_Greg_Hernandez_2.jpg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/RuPaul"
  },
  {
    dragName: "BenDeLaCreme",
    realName: "Benjamin Putnam",
    age: 42,
    hometown: "Chicago, Illinois",
    season: "Season 6",
    franchise: "US",
    outcome: "4th Place",
    biography: "BenDeLaCreme is an American drag queen and performer based in Seattle, Washington. Known for her vintage aesthetic and comedic performances.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/BenDeLaCreme_2014.jpg/220px-BenDeLaCreme_2014.jpg",
    wikipediaUrl: "https://en.wikipedia.org/wiki/BenDeLaCreme"
  },
  {
    dragName: "Bianca Del Rio",
    realName: "Roy Richard Haylock",
    age: 49,
    hometown: "New Orleans, Louisiana",
    season: "Season 6",
    franchise: "US",
    outcome: "Winner",
    biography: "Bianca Del Rio is the stage name of Roy Richard Haylock, an American drag queen, comedian, and author. Winner of the sixth season of RuPaul's Drag Race.",
    photoUrl: null,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Bianca_Del_Rio"
  },
  {
    dragName: "Adore Delano",
    realName: "Daniel Anthony Noriega",
    age: 34,
    hometown: "Azusa, California",
    season: "Season 6",
    franchise: "US",
    outcome: "Runner-up",
    biography: "Adore Delano is the drag persona of Danny Noriega, an American drag queen, singer-songwriter and television personality.",
    photoUrl: null,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Adore_Delano"
  },
  {
    dragName: "Courtney Act",
    realName: "Shane Gilberto Jenek",
    age: 42,
    hometown: "Brisbane, Australia",
    season: "Season 6",
    franchise: "US",
    outcome: "Runner-up",
    biography: "Courtney Act is the drag persona of Shane Gilberto Jenek, an Australian drag queen, pop singer, entertainer and reality television personality.",
    photoUrl: null,
    wikipediaUrl: "https://en.wikipedia.org/wiki/Courtney_Act"
  }
];

const SAMPLE_SEASONS = [
  {
    name: "RuPaul's Drag Race Season 1",
    franchise: "US",
    year: 2009,
    wikipediaUrl: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_1)"
  },
  {
    name: "RuPaul's Drag Race Season 6",
    franchise: "US", 
    year: 2014,
    wikipediaUrl: "https://en.wikipedia.org/wiki/RuPaul%27s_Drag_Race_(season_6)"
  }
];

export class MockRuPaulScraper {
  private currentJobId: string | null = null;

  async startScraping(options: MockScrapingOptions = {}): Promise<string> {
    if (this.currentJobId) {
      throw new Error("Scraping job already in progress");
    }

    const job = await storage.createScrapingJob({
      status: "running",
      progress: 0,
      totalItems: SAMPLE_CONTESTANTS.length + SAMPLE_SEASONS.length,
      startedAt: new Date(),
    });

    this.currentJobId = job.id;

    // Start the mock scraping process
    this.simulateScraping(job.id, options);
    
    return job.id;
  }

  private async simulateScraping(jobId: string, options: MockScrapingOptions) {
    try {
      let progress = 0;
      const totalItems = SAMPLE_CONTESTANTS.length + SAMPLE_SEASONS.length;

      // Simulate scraping seasons first
      broadcastProgress({
        jobId,
        status: "running",
        progress: 0,
        totalItems,
        message: "Initializing scraper...",
        currentItem: "Starting scraping process"
      });

      await this.sleep(1000);

      // Create seasons
      for (let i = 0; i < SAMPLE_SEASONS.length; i++) {
        const season = SAMPLE_SEASONS[i];
        progress = Math.round(((i + 1) / totalItems) * 100);

        broadcastProgress({
          jobId,
          status: "running", 
          progress,
          totalItems,
          message: `Processing season: ${season.name}`,
          currentItem: season.name
        });

        await storage.createSeason({
          name: season.name,
          franchiseId: season.franchiseId,
          year: season.year,
          wikipediaUrl: season.wikipediaUrl,
          isScraped: true
        });

        await this.sleep(800);
      }

      // Create contestants
      for (let i = 0; i < SAMPLE_CONTESTANTS.length; i++) {
        const contestant = SAMPLE_CONTESTANTS[i];
        progress = Math.round(((SAMPLE_SEASONS.length + i + 1) / totalItems) * 100);

        broadcastProgress({
          jobId,
          status: "running",
          progress,
          totalItems,
          message: `Processing contestant: ${contestant.dragName}`,
          currentItem: contestant.dragName
        });

        await storage.createContestant({
          dragName: contestant.dragName,
          realName: contestant.realName,
          hometown: contestant.hometown,
          biography: contestant.biography,
          photoUrl: contestant.photoUrl,
          detailsUrl: contestant.wikipediaUrl
        });

        await this.sleep(1200);
      }

      // Complete the job
      await storage.updateScrapingJob(jobId, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      });

      broadcastProgress({
        jobId,
        status: "completed",
        progress: 100,
        totalItems,
        message: `Scraping completed successfully! Found ${SAMPLE_CONTESTANTS.length} contestants and ${SAMPLE_SEASONS.length} seasons.`,
        currentItem: "Finished"
      });

    } catch (error) {
      await storage.updateScrapingJob(jobId, {
        status: "failed", 
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      });

      broadcastProgress({
        jobId,
        status: "failed",
        progress: 0,
        totalItems: 0,
        message: `Scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      this.currentJobId = null;
    }
  }

  async stopScraping(): Promise<void> {
    if (!this.currentJobId) {
      throw new Error("No scraping job in progress");
    }

    await storage.updateScrapingJob(this.currentJobId, {
      status: "failed",
      completedAt: new Date(),
    });

    broadcastProgress({
      jobId: this.currentJobId,
      status: "failed",
      progress: 0,
      totalItems: 0,
      message: "Scraping stopped by user",
    });

    this.currentJobId = null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    // Mock cleanup - nothing to do
  }

  isRunning(): boolean {
    return this.currentJobId !== null;
  }
}