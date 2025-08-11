import { type Contestant, type InsertContestant, type UpdateContestant, type Season, type InsertSeason, type ScrapingJob, type InsertScrapingJob, type AppStats, type Appearance, type InsertAppearance, type Franchise, type InsertFranchise, contestants, seasons, appearances, scrapingJobs, franchises, FullContestant } from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, ilike, or, and, desc, count, sql, getTableColumns } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Contestants
  getContestants(): Promise<FullContestant[]>;
  getContestant(id: string): Promise<Contestant | undefined>;
  getContestantsBySearch(search: string): Promise<FullContestant[]>;
  getContestantByDragName(dragName: string): Promise<Contestant | undefined>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: string, contestant: UpdateContestant): Promise<Contestant | undefined>;
  deleteContestant(id: string): Promise<boolean>;
  getRecentContestants(limit: number): Promise<FullContestant[]>;

  // Franchises
  getAllFranchises(): Promise<Franchise[]>;
  getFranchiseByName(name: string): Promise<Franchise | undefined>;
  createFranchise(name: string): Promise<Franchise>;

  // Seasons
  getAllSeasons(): Promise<Season[]>;
  getSeason(id: string): Promise<Season | undefined>;
  getSeasonByName(name: string): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: string, season: Partial<InsertSeason>): Promise<Season | undefined>;

  // Appearances
  getAppearance(contestantId: string, seasonId: string): Promise<Appearance | undefined>;
  createAppearance(appearance: InsertAppearance): Promise<Appearance>;

  // Scraping Jobs
  getScrapingJobs(): Promise<ScrapingJob[]>;
  getScrapingJob(id: string): Promise<ScrapingJob | undefined>;
  getActiveScrapingJob(): Promise<ScrapingJob | undefined>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: string, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined>;

  // Stats
  getAppStats(): Promise<AppStats>;
}

export class DrizzleStorage implements IStorage {
  async getContestants(): Promise<FullContestant[]> {
    try {
      const result = await db.select({
        id: contestants.id,
        dragName: contestants.dragName,
        realName: contestants.realName,
        hometown: contestants.hometown,
        biography: contestants.biography,
        photoUrl: contestants.photoUrl,
        detailsUrl: contestants.detailsUrl,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        wikipediaUrl: seasons.wikipediaUrl,
        createdAt: contestants.createdAt,
        updatedAt: contestants.updatedAt,
      })
      .from(contestants)
      .leftJoin(appearances, eq(contestants.id, appearances.contestantId))
      .leftJoin(seasons, eq(appearances.seasonId, seasons.id))
      .leftJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .orderBy(desc(contestants.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching contestants:', error);
      return [];
    }
  }

  async getContestant(id: string): Promise<Contestant | undefined> {
    const result = await db.select().from(contestants).where(eq(contestants.id, id));
    return result[0];
  }

  async getContestantsBySearch(search: string): Promise<FullContestant[]> {
    try {
      const result = await db.select({
        id: contestants.id,
        dragName: contestants.dragName,
        realName: contestants.realName,
        hometown: contestants.hometown,
        biography: contestants.biography,
        photoUrl: contestants.photoUrl,
        detailsUrl: contestants.detailsUrl,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        wikipediaUrl: seasons.wikipediaUrl,
        createdAt: contestants.createdAt,
        updatedAt: contestants.updatedAt,
      })
      .from(contestants)
      .leftJoin(appearances, eq(contestants.id, appearances.contestantId))
      .leftJoin(seasons, eq(appearances.seasonId, seasons.id))
      .leftJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .where(or(
        ilike(contestants.dragName, `%${search}%`),
        ilike(contestants.realName, `%${search}%`)
      ));
      
      return result;
    } catch (error) {
      console.error('Error searching contestants:', error);
      return [];
    }
  }

  async getContestantByDragName(dragName: string): Promise<Contestant | undefined> {
    const result = await db.select().from(contestants).where(eq(contestants.dragName, dragName));
    return result[0];
  }

  async createContestant(insertContestant: InsertContestant): Promise<Contestant> {
    const result = await db.insert(contestants).values(insertContestant).returning();
    return result[0];
  }

  async updateContestant(id: string, updateData: UpdateContestant): Promise<Contestant | undefined> {
    const result = await db.update(contestants).set(updateData).where(eq(contestants.id, id)).returning();
    return result[0];
  }

  async getRecentContestants(limit: number): Promise<FullContestant[]> {
    try {
      const result = await db.select({
        id: contestants.id,
        dragName: contestants.dragName,
        realName: contestants.realName,
        hometown: contestants.hometown,
        biography: contestants.biography,
        photoUrl: contestants.photoUrl,
        detailsUrl: contestants.detailsUrl,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        wikipediaUrl: seasons.wikipediaUrl,
        createdAt: contestants.createdAt,
        updatedAt: contestants.updatedAt,
      })
      .from(contestants)
      .leftJoin(appearances, eq(contestants.id, appearances.contestantId))
      .leftJoin(seasons, eq(appearances.seasonId, seasons.id))
      .leftJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .orderBy(desc(contestants.createdAt))
      .limit(limit);
      
      return result;
    } catch (error) {
      console.error('Error fetching recent contestants:', error);
      return [];
    }
  }

  async deleteContestant(id: string): Promise<boolean> {
    const result = await db.delete(contestants).where(eq(contestants.id, id)).returning({ id: contestants.id });
    return result.length > 0;
  }



  async getAllFranchises(): Promise<Franchise[]> {
    return db.select().from(franchises).orderBy(franchises.name);
  }

  async getFranchiseByName(name: string): Promise<Franchise | undefined> {
    const result = await db.select().from(franchises).where(eq(franchises.name, name));
    return result[0];
  }

  async createFranchise(name: string): Promise<Franchise> {
    const result = await db.insert(franchises)
      .values({ name })
      .onConflictDoUpdate({ target: franchises.name, set: { name } })
      .returning();
    return result[0];
  }

  async getAllSeasons(): Promise<(Season & { franchiseName: string; })[]> {
    const result = await db
      .select({
        ...getTableColumns(seasons),
        franchiseName: franchises.name,
      })
      .from(seasons)
      .leftJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .orderBy(desc(seasons.year));

    return result.map(r => ({ ...r, franchiseName: r.franchiseName || 'Unknown' }));
  }

  async getSeason(id: string): Promise<Season | undefined> {
    const result = await db.select().from(seasons).where(eq(seasons.id, id));
    return result[0];
  }

  async createSeason(insertSeason: InsertSeason): Promise<Season> {
    const result = await db.insert(seasons).values(insertSeason).onConflictDoNothing().returning();
    if (result[0]) {
      return result[0];
    }
    return (await db.select().from(seasons).where(eq(seasons.name, insertSeason.name)))[0];
  }

  async getSeasonByName(name: string): Promise<Season | undefined> {
    const result = await db.select().from(seasons).where(eq(seasons.name, name));
    return result[0];
  }

  async updateSeason(id: string, updateData: Partial<InsertSeason>): Promise<Season | undefined> {
    const result = await db.update(seasons).set(updateData).where(eq(seasons.id, id)).returning();
    return result[0];
  }

  async getAppearance(contestantId: string, seasonId: string): Promise<Appearance | undefined> {
    const result = await db.select().from(appearances).where(and(eq(appearances.contestantId, contestantId), eq(appearances.seasonId, seasonId)));
    return result[0];
  }

  async createAppearance(appearance: InsertAppearance): Promise<Appearance> {
    const result = await db.insert(appearances).values(appearance).onConflictDoNothing().returning();
    return result[0];
  }

  async getScrapingJobs(): Promise<ScrapingJob[]> {
    return db.select().from(scrapingJobs).orderBy(desc(scrapingJobs.createdAt));
  }

  async getScrapingJob(id: string): Promise<ScrapingJob | undefined> {
    const result = await db.select().from(scrapingJobs).where(eq(scrapingJobs.id, id));
    return result[0];
  }

  async getActiveScrapingJob(): Promise<ScrapingJob | undefined> {
    const result = await db.select().from(scrapingJobs).where(or(eq(scrapingJobs.status, 'running'), eq(scrapingJobs.status, 'pending'))).limit(1);
    return result[0];
  }

  async createScrapingJob(insertJob: InsertScrapingJob): Promise<ScrapingJob> {
    const result = await db.insert(scrapingJobs).values(insertJob).returning();
    return result[0];
  }

  async updateScrapingJob(id: string, updateData: Partial<ScrapingJob>): Promise<ScrapingJob | undefined> {
    const result = await db.update(scrapingJobs).set(updateData).where(eq(scrapingJobs.id, id)).returning();
    return result[0];
  }

  async getAppStats(): Promise<AppStats> {
    const contestantsCount = await db.select({ count: count() }).from(contestants);
    const seasonsCount = await db.select({ count: count() }).from(seasons);
    const franchisesCount = await db.select({ count: count() }).from(franchises);
    const photosCount = await db.select({ count: count() }).from(contestants).where(sql`${contestants.photoUrl} is not null`);

    const recentJob = await db.select().from(scrapingJobs).where(eq(scrapingJobs.status, 'completed')).orderBy(desc(scrapingJobs.completedAt)).limit(1);
    const lastSync = recentJob[0]?.completedAt ? this.formatTimeAgo(new Date(recentJob[0].completedAt)) : undefined;

    return {
      contestants: contestantsCount[0].count,
      seasons: seasonsCount[0].count,
      franchises: Number(franchisesCount[0].count),
      photos: photosCount[0].count,
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

export const storage = new DrizzleStorage();
