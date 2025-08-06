import { type Contestant, type InsertContestant, type UpdateContestant, type Season, type InsertSeason, type ScrapingJob, type InsertScrapingJob, type AppStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Contestants
  getContestants(): Promise<Contestant[]>;
  getContestant(id: string): Promise<Contestant | undefined>;
  getContestantsBySearch(search: string): Promise<Contestant[]>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: string, contestant: UpdateContestant): Promise<Contestant | undefined>;
  deleteContestant(id: string): Promise<boolean>;
  getRecentContestants(limit: number): Promise<Contestant[]>;

  // Seasons
  getSeasons(): Promise<Season[]>;
  getSeason(id: string): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: string, season: Partial<InsertSeason>): Promise<Season | undefined>;

  // Scraping Jobs
  getScrapingJobs(): Promise<ScrapingJob[]>;
  getScrapingJob(id: string): Promise<ScrapingJob | undefined>;
  getActiveScrapingJob(): Promise<ScrapingJob | undefined>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: string, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined>;

  // Stats
  getAppStats(): Promise<AppStats>;
}

export class MemStorage implements IStorage {
  private contestants: Map<string, Contestant>;
  private seasons: Map<string, Season>;
  private scrapingJobs: Map<string, ScrapingJob>;

  constructor() {
    this.contestants = new Map();
    this.seasons = new Map();
    this.scrapingJobs = new Map();
  }

  async getContestants(): Promise<Contestant[]> {
    return Array.from(this.contestants.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getContestant(id: string): Promise<Contestant | undefined> {
    return this.contestants.get(id);
  }

  async getContestantsBySearch(search: string): Promise<Contestant[]> {
    const searchLower = search.toLowerCase();
    return Array.from(this.contestants.values()).filter(contestant =>
      contestant.dragName.toLowerCase().includes(searchLower) ||
      contestant.realName?.toLowerCase().includes(searchLower) ||
      contestant.hometown?.toLowerCase().includes(searchLower) ||
      contestant.season.toLowerCase().includes(searchLower)
    );
  }

  async createContestant(insertContestant: InsertContestant): Promise<Contestant> {
    const id = randomUUID();
    const contestant: Contestant = {
      ...insertContestant,
      id,
      realName: insertContestant.realName ?? null,
      age: insertContestant.age ?? null,
      hometown: insertContestant.hometown ?? null,
      outcome: insertContestant.outcome ?? null,
      biography: insertContestant.biography ?? null,
      photoUrl: insertContestant.photoUrl ?? null,
      wikipediaUrl: insertContestant.wikipediaUrl ?? null,
      isScraped: insertContestant.isScraped ?? false,
      franchise: insertContestant.franchise ?? "US",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contestants.set(id, contestant);
    return contestant;
  }

  async updateContestant(id: string, updateData: UpdateContestant): Promise<Contestant | undefined> {
    const existing = this.contestants.get(id);
    if (!existing) return undefined;

    const updated: Contestant = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.contestants.set(id, updated);
    return updated;
  }

  async deleteContestant(id: string): Promise<boolean> {
    return this.contestants.delete(id);
  }

  async getRecentContestants(limit: number): Promise<Contestant[]> {
    const contestants = Array.from(this.contestants.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
    return contestants;
  }

  async getSeasons(): Promise<Season[]> {
    return Array.from(this.seasons.values()).sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  async getSeason(id: string): Promise<Season | undefined> {
    return this.seasons.get(id);
  }

  async createSeason(insertSeason: InsertSeason): Promise<Season> {
    const id = randomUUID();
    const season: Season = {
      ...insertSeason,
      id,
      year: insertSeason.year ?? null,
      wikipediaUrl: insertSeason.wikipediaUrl ?? null,
      isScraped: insertSeason.isScraped ?? null,
      createdAt: new Date(),
    };
    this.seasons.set(id, season);
    return season;
  }

  async updateSeason(id: string, updateData: Partial<InsertSeason>): Promise<Season | undefined> {
    const existing = this.seasons.get(id);
    if (!existing) return undefined;

    const updated: Season = {
      ...existing,
      ...updateData,
    };
    this.seasons.set(id, updated);
    return updated;
  }

  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return Array.from(this.scrapingJobs.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getScrapingJob(id: string): Promise<ScrapingJob | undefined> {
    return this.scrapingJobs.get(id);
  }

  async getActiveScrapingJob(): Promise<ScrapingJob | undefined> {
    return Array.from(this.scrapingJobs.values()).find(job => 
      job.status === 'running' || job.status === 'pending'
    );
  }

  async createScrapingJob(insertJob: InsertScrapingJob): Promise<ScrapingJob> {
    const id = randomUUID();
    const job: ScrapingJob = {
      ...insertJob,
      id,
      status: insertJob.status ?? "pending",
      progress: insertJob.progress ?? null,
      totalItems: insertJob.totalItems ?? null,
      currentItem: insertJob.currentItem ?? null,
      errorMessage: insertJob.errorMessage ?? null,
      screenshots: insertJob.screenshots ?? null,
      startedAt: insertJob.startedAt ?? null,
      completedAt: insertJob.completedAt ?? null,
      createdAt: new Date(),
    };
    this.scrapingJobs.set(id, job);
    return job;
  }

  async updateScrapingJob(id: string, updateData: Partial<ScrapingJob>): Promise<ScrapingJob | undefined> {
    const existing = this.scrapingJobs.get(id);
    if (!existing) return undefined;

    const updated: ScrapingJob = {
      ...existing,
      ...updateData,
    };
    this.scrapingJobs.set(id, updated);
    return updated;
  }

  async getAppStats(): Promise<AppStats> {
    const contestants = Array.from(this.contestants.values());
    const seasons = Array.from(this.seasons.values());
    
    const franchises = new Set(contestants.map(c => c.franchise)).size;
    const photos = contestants.filter(c => c.photoUrl).length;
    
    const recentJob = Array.from(this.scrapingJobs.values())
      .filter(job => job.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())[0];
    
    const lastSync = recentJob?.completedAt ? this.formatTimeAgo(new Date(recentJob.completedAt)) : undefined;

    return {
      contestants: contestants.length,
      seasons: seasons.length,
      franchises: Math.max(1, franchises),
      photos,
      lastSync,
    };
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return "1 week ago";
    return `${diffInWeeks} weeks ago`;
  }
}

export const storage = new MemStorage();
