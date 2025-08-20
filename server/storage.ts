import { type Contestant, type InsertContestant, type UpdateContestant, type Season, type InsertSeason, type ScrapingJob, type InsertScrapingJob, type AppStats, type Appearance, type InsertAppearance, type Franchise, type InsertFranchise, contestants, seasons, appearances, scrapingJobs, franchises, FullContestant } from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, ilike, or, and, desc, asc, count, sql, getTableColumns } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';
import { isImageScrapingEnabled } from './config';

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
  createContestantWithFandomUrl(contestant: InsertContestant): Promise<Contestant>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: string, contestant: UpdateContestant): Promise<Contestant | undefined>;
  deleteContestant(id: string): Promise<boolean>;
  getRecentContestants(limit: number): Promise<FullContestant[]>;

  // Franchises
  getAllFranchises(): Promise<Franchise[]>;
  getFranchiseByName(name: string): Promise<Franchise | undefined>;
  createFranchise(franchise: InsertFranchise): Promise<Franchise>;
  updateFranchise(id: string, franchise: Partial<InsertFranchise>): Promise<Franchise | undefined>;
  deleteFranchise(id: string): Promise<boolean>;

  // Seasons
  getAllSeasons(options?: { franchiseId?: string; sortBy?: keyof Season | 'franchiseName'; sortOrder?: 'asc' | 'desc'; search?: string }): Promise<(Season & { franchiseName: string })[]>;
  getSeason(id: string): Promise<(Season & { franchise?: Franchise }) | undefined>;
  getSeasonByName(name: string): Promise<Season | undefined>;
  createSeason(season: InsertSeason): Promise<Season>;
  updateSeason(id: string, season: Partial<InsertSeason>): Promise<Season | undefined>;
  deleteSeason(id: string): Promise<boolean>;

  // Appearances
  getAllAppearances(): Promise<(Appearance & { contestantDragName: string; seasonName: string; franchiseName: string })[]>;
  getAppearance(contestantId: string, seasonId: string): Promise<Appearance | undefined>;
  createAppearance(appearance: InsertAppearance): Promise<Appearance>;
  updateAppearance(id: string, appearance: Partial<InsertAppearance>): Promise<Appearance | undefined>;
  deleteAppearance(id: string): Promise<boolean>;

  // Scraping Jobs
  getScrapingJobs(): Promise<ScrapingJob[]>;
  getScrapingJob(id: string): Promise<ScrapingJob | undefined>;
  getActiveScrapingJob(): Promise<ScrapingJob | undefined>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: string, job: Partial<ScrapingJob>): Promise<ScrapingJob | undefined>;

  // Stats
  getAppStats(): Promise<AppStats>;

  // Bulk operations for data cleanup
  truncateAllTables(): Promise<void>;

  // Related data methods
  getSeasonsByFranchise(franchiseId: string): Promise<(Season & { franchiseName: string })[]>;
  getContestantsBySeason(seasonId: string): Promise<FullContestant[]>;
  getAppearancesByContestant(contestantId: string): Promise<(Appearance & { seasonName: string; franchiseName: string })[]>;
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
        twitter: contestants.twitter,
        instagram: contestants.instagram,
        tiktok: contestants.tiktok,
        metadataSourceUrl: contestants.metadataSourceUrl,
        hasImages: contestants.hasImages,
        imageCount: contestants.imageCount,
        imageUrls: contestants.imageUrls,
        lastImageScrapeAt: contestants.lastImageScrapeAt,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        seasonMetadataSourceUrl: seasons.metadataSourceUrl,
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
        twitter: contestants.twitter,
        instagram: contestants.instagram,
        tiktok: contestants.tiktok,
        metadataSourceUrl: contestants.metadataSourceUrl,
        hasImages: contestants.hasImages,
        imageCount: contestants.imageCount,
        imageUrls: contestants.imageUrls,
        lastImageScrapeAt: contestants.lastImageScrapeAt,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        seasonMetadataSourceUrl: seasons.metadataSourceUrl,
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

  async createContestantWithFandomUrl(insertContestant: InsertContestant): Promise<Contestant> {
    // First check if contestant already exists
    const existingContestant = await this.getContestantByDragName(insertContestant.dragName);
    if (existingContestant) {
      console.log(`[storage] Contestant ${insertContestant.dragName} already exists, skipping fandom URL lookup`);
      return existingContestant;
    }

    // If no metadata source URL is provided and this is a new contestant, attempt to find fandom URL
    if (!insertContestant.metadataSourceUrl) {
      try {
        const { getFandomUrl } = await import('./services/fandom-lookup.js');
        console.log(`[storage] Attempting to find fandom URL for new contestant: ${insertContestant.dragName}`);
        
        const fandomUrl = await getFandomUrl(insertContestant.dragName, { headless: true, timeout: 15000 });
        if (fandomUrl) {
          console.log(`[storage] Found fandom URL for ${insertContestant.dragName}: ${fandomUrl}`);
          insertContestant.metadataSourceUrl = fandomUrl;
        } else {
          console.log(`[storage] No fandom URL found for ${insertContestant.dragName}`);
        }
      } catch (error) {
        console.error(`[storage] Error looking up fandom URL for ${insertContestant.dragName}:`, error);
      }
    }

    // Create the contestant with or without the fandom URL
    const result = await db.insert(contestants).values(insertContestant).returning();
    const newContestant = result[0];

    // If we found a fandom URL and image scraping is enabled, scrape images automatically
    if (insertContestant.metadataSourceUrl && isImageScrapingEnabled()) {
      console.log(`[storage] Image scraping is enabled. Starting image scraping for ${newContestant.dragName}`);
      
      try {
        // Import and use image scraper
        const { imageScraper } = await import('./services/image-scraper.js');
        
        // Get season name for context (if available)
        const seasonName = undefined; // Season name not available in InsertContestant
        
        // Start image scraping asynchronously (don't block contestant creation)
        imageScraper.scrapeContestantImages(
          newContestant.dragName,
          insertContestant.metadataSourceUrl,
          seasonName
        ).then((imageResult) => {
          console.log(`[storage] Image scraping completed for ${newContestant.dragName}:`, imageResult);
        }).catch((imageError) => {
          console.error(`[storage] Image scraping failed for ${newContestant.dragName}:`, imageError);
        });
        
      } catch (error) {
        console.error(`[storage] Error initializing image scraper for ${newContestant.dragName}:`, error);
      }
    } else if (insertContestant.metadataSourceUrl) {
      console.log(`[storage] Image scraping is disabled for ${newContestant.dragName}`);
    }

    return newContestant;
  }

  async updateContestant(id: string, updateData: UpdateContestant): Promise<Contestant | undefined> {
    const result = await db.update(contestants).set(updateData).where(eq(contestants.id, id)).returning();
    return result[0];
  }

  async updateContestantImages(dragName: string, imageUrls: string[]): Promise<void> {
    try {
      await db.update(contestants)
        .set({
          hasImages: imageUrls.length > 0,
          imageCount: imageUrls.length,
          imageUrls: imageUrls,
          lastImageScrapeAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(contestants.dragName, dragName));
      
      console.log(`[storage] Updated image information for ${dragName}: ${imageUrls.length} images`);
    } catch (error) {
      console.error(`[storage] Failed to update image information for ${dragName}:`, error);
      throw error;
    }
  }

  async getRecentContestants(limit: number): Promise<FullContestant[]> {
    try {
      const result = await db.select({
        id: contestants.id,
        dragName: contestants.dragName,
        realName: contestants.realName,
        hometown: contestants.hometown,
        biography: contestants.biography,
        twitter: contestants.twitter,
        instagram: contestants.instagram,
        tiktok: contestants.tiktok,
        metadataSourceUrl: contestants.metadataSourceUrl,
        hasImages: contestants.hasImages,
        imageCount: contestants.imageCount,
        imageUrls: contestants.imageUrls,
        lastImageScrapeAt: contestants.lastImageScrapeAt,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        seasonMetadataSourceUrl: seasons.metadataSourceUrl,
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

  async createFranchise(franchise: InsertFranchise): Promise<Franchise> {
    const result = await db.insert(franchises)
      .values(franchise)
      .onConflictDoUpdate({ 
        target: franchises.name, 
        set: { 
          name: franchise.name,
          metadataSourceUrl: franchise.metadataSourceUrl 
        } 
      })
      .returning();
    return result[0];
  }

  async getAllSeasons(options: {
    franchiseId?: string;
    sortBy?: keyof Season | 'franchiseName';
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}): Promise<(Season & { franchiseName: string })[]> {
    const { franchiseId, sortBy = 'year', sortOrder = 'desc', search } = options;

    const sortColumnMap: Record<string, any> = {
      name: seasons.name,
      franchiseName: franchises.name,
      year: seasons.year,
      createdAt: seasons.createdAt,
    };

    const sortColumn = sortColumnMap[sortBy] || seasons.year;
    const orderByClause = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const conditions = [];
    if (franchiseId) {
      conditions.push(eq(seasons.franchiseId, franchiseId));
    }
    if (search) {
      conditions.push(ilike(seasons.name, `%${search}%`));
    }

    const query = db
      .select({
        ...getTableColumns(seasons),
        franchiseName: franchises.name,
      })
      .from(seasons)
      .leftJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .where(and(...conditions))
      .orderBy(orderByClause);

    const result = await query;

    return result.map(r => ({ ...r, franchiseName: r.franchiseName || 'Unknown' }));
  }

  async getSeason(id: string): Promise<(Season & { franchise?: Franchise }) | undefined> {
    try {
      // First get the season
      const seasonResult = await db.select().from(seasons).where(eq(seasons.id, id));
      
      if (seasonResult.length === 0) {
        return undefined;
      }
      
      const season = seasonResult[0];
      
      // Then get the franchise if it exists
      let franchise = undefined;
      if (season.franchiseId) {
        const franchiseResult = await db.select().from(franchises).where(eq(franchises.id, season.franchiseId));
        franchise = franchiseResult[0] || undefined;
      }
      
      return { ...season, franchise };
      
    } catch (error) {
      console.error('Error fetching season:', error);
      return undefined;
    }
  }

  async createSeason(insertSeason: InsertSeason): Promise<Season> {
    const [result] = await db
      .insert(seasons)
      .values(insertSeason)
      .onConflictDoUpdate({
        target: seasons.name,
        set: {
          franchiseId: insertSeason.franchiseId,
          year: insertSeason.year,
          metadataSourceUrl: insertSeason.metadataSourceUrl,
          isScraped: insertSeason.isScraped,
        },
      })
      .returning();
    return result;
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

  async getAllAppearances(): Promise<(Appearance & { contestantDragName: string; seasonName: string; franchiseName: string })[]> {
    try {
      const result = await db.select({
        id: appearances.id,
        contestantId: appearances.contestantId,
        seasonId: appearances.seasonId,
        age: appearances.age,
        outcome: appearances.outcome,
        createdAt: appearances.createdAt,
        contestantDragName: contestants.dragName,
        seasonName: seasons.name,
        franchiseName: franchises.name,
      })
      .from(appearances)
      .innerJoin(contestants, eq(appearances.contestantId, contestants.id))
      .innerJoin(seasons, eq(appearances.seasonId, seasons.id))
      .innerJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .orderBy(desc(appearances.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching appearances:', error);
      return [];
    }
  }

  async updateFranchise(id: string, updateData: Partial<InsertFranchise>): Promise<Franchise | undefined> {
    const result = await db.update(franchises).set(updateData).where(eq(franchises.id, id)).returning();
    return result[0];
  }

  async deleteFranchise(id: string): Promise<boolean> {
    const result = await db.delete(franchises).where(eq(franchises.id, id)).returning({ id: franchises.id });
    return result.length > 0;
  }

  async deleteSeason(id: string): Promise<boolean> {
    const result = await db.delete(seasons).where(eq(seasons.id, id)).returning({ id: seasons.id });
    return result.length > 0;
  }

  async updateAppearance(id: string, updateData: Partial<InsertAppearance>): Promise<Appearance | undefined> {
    const result = await db.update(appearances).set(updateData).where(eq(appearances.id, id)).returning();
    return result[0];
  }

  async deleteAppearance(id: string): Promise<boolean> {
    const result = await db.delete(appearances).where(eq(appearances.id, id)).returning({ id: appearances.id });
    return result.length > 0;
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
    const [contestantsCount] = await db.select({ count: count() }).from(contestants);
    const [seasonsCount] = await db.select({ count: count() }).from(seasons);
    const [franchisesCount] = await db.select({ count: count() }).from(franchises);
    const [photosCount] = await db.select({ count: count() }).from(contestants).where(sql`${contestants.age} is not null`);

    const [recentJob] = await db.select().from(scrapingJobs).where(eq(scrapingJobs.status, 'completed')).orderBy(desc(scrapingJobs.completedAt)).limit(1);
    const lastSync = recentJob?.completedAt ? this.formatTimeAgo(new Date(recentJob.completedAt)) : undefined;

    return {
      contestants: contestantsCount.count,
      seasons: seasonsCount.count,
      franchises: Number(franchisesCount.count),
      photos: photosCount.count,
      lastSync,
    };
  }

  // Related data methods
  async getSeasonsByFranchise(franchiseId: string): Promise<(Season & { franchiseName: string })[]> {
    try {
      const result = await db.select({
        ...getTableColumns(seasons),
        franchiseName: franchises.name,
      })
      .from(seasons)
      .innerJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .where(eq(seasons.franchiseId, franchiseId))
      .orderBy(desc(seasons.year));
      
      return result.map(r => ({ ...r, franchiseName: r.franchiseName || 'Unknown' }));
    } catch (error) {
      console.error('Error fetching seasons by franchise:', error);
      return [];
    }
  }

  async getContestantsBySeason(seasonId: string): Promise<FullContestant[]> {
    try {
      const result = await db.select({
        id: contestants.id,
        dragName: contestants.dragName,
        realName: contestants.realName,
        hometown: contestants.hometown,
        biography: contestants.biography,
        twitter: contestants.twitter,
        instagram: contestants.instagram,
        tiktok: contestants.tiktok,
        metadataSourceUrl: contestants.metadataSourceUrl,
        hasImages: contestants.hasImages,
        imageCount: contestants.imageCount,
        imageUrls: contestants.imageUrls,
        lastImageScrapeAt: contestants.lastImageScrapeAt,
        age: appearances.age,
        outcome: appearances.outcome,
        season: seasons.name,
        franchise: franchises.name,
        seasonMetadataSourceUrl: seasons.metadataSourceUrl,
        createdAt: contestants.createdAt,
        updatedAt: contestants.updatedAt,
      })
      .from(contestants)
      .innerJoin(appearances, eq(contestants.id, appearances.contestantId))
      .innerJoin(seasons, eq(appearances.seasonId, seasons.id))
      .innerJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .where(eq(appearances.seasonId, seasonId))
      .orderBy(contestants.dragName);
      
      return result;
    } catch (error) {
      console.error('Error fetching contestants by season:', error);
      return [];
    }
  }

  async getAppearancesByContestant(contestantId: string): Promise<(Appearance & { seasonName: string; franchiseName: string })[]> {
    try {
      const result = await db.select({
        id: appearances.id,
        contestantId: appearances.contestantId,
        seasonId: appearances.seasonId,
        age: appearances.age,
        outcome: appearances.outcome,
        createdAt: appearances.createdAt,
        seasonName: seasons.name,
        franchiseName: franchises.name,
      })
      .from(appearances)
      .innerJoin(seasons, eq(appearances.seasonId, seasons.id))
      .innerJoin(franchises, eq(seasons.franchiseId, franchises.id))
      .where(eq(appearances.contestantId, contestantId))
      .orderBy(desc(seasons.year));
      
      return result;
    } catch (error) {
      console.error('Error fetching appearances by contestant:', error);
      return [];
    }
  }

  async truncateAllTables(): Promise<void> {
    try {
      console.log('[truncate] Starting bulk data cleanup...');
      
      // Delete only scraped data in dependency order (foreign key constraints)
      // Keep scraping jobs for history/logging purposes
      await db.delete(appearances);
      console.log('[truncate] Cleared appearances table');
      
      await db.delete(contestants);
      console.log('[truncate] Cleared contestants table');
      
      await db.delete(seasons);
      console.log('[truncate] Cleared seasons table');
      
      await db.delete(franchises);
      console.log('[truncate] Cleared franchises table');
      
      console.log('[truncate] Bulk data cleanup completed');
    } catch (error) {
      console.error('Error during data cleanup:', error);
      throw error;
    }
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
