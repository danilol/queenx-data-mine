import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contestants = pgTable("contestants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dragName: text("drag_name").notNull().unique(),
  realName: text("real_name"),
  hometown: text("hometown"),
  biography: text("biography"),
  age: integer("age"),
  twitter: text("twitter"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  metadataSourceUrl: text("metadata_source_url"), // Source URL for contestant data scraping
  hasImages: boolean("has_images").default(false), // Flag to indicate if images were successfully downloaded
  imageCount: integer("image_count").default(0), // Number of images downloaded
  imageUrls: text("image_urls").array(), // S3 URLs of downloaded images
  lastImageScrapeAt: timestamp("last_image_scrape_at"), // When images were last scraped
  // Biographical information from Fandom
  gender: text("gender"),
  pronouns: text("pronouns"),
  height: text("height"),
  dateOfBirth: text("date_of_birth"), // Stored as text for flexibility with different formats
  birthplace: text("birthplace"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const franchises = pgTable("franchises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  metadataSourceUrl: text("metadata_source_url"), // Source URL for franchise data scraping
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  franchiseId: varchar("franchise_id").notNull(),
  year: integer("year"),
  metadataSourceUrl: text("metadata_source_url"), // Source URL for season data scraping
  isScraped: boolean("is_scraped").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appearances = pgTable("appearances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestantId: varchar("contestant_id")
    .notNull()
    .references(() => contestants.id),
  seasonId: varchar("season_id")
    .notNull()
    .references(() => seasons.id),
  age: integer("age"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scrapingJobs = pgTable("scraping_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").default(0),
  totalItems: integer("total_items").default(0),
  currentItem: text("current_item"),
  errorMessage: text("error_message"),
  screenshots: text("screenshots").array(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types for all tables
export const insertContestantSchema = createInsertSchema(contestants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContestantSchema = insertContestantSchema.partial();

export const insertFranchiseSchema = createInsertSchema(franchises).omit({
  id: true,
  createdAt: true,
});

export const insertSeasonSchema = createInsertSchema(seasons).omit({
  id: true,
  createdAt: true,
});

export const insertAppearanceSchema = createInsertSchema(appearances).omit({
  id: true,
  createdAt: true,
});

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs).omit({
  id: true,
  createdAt: true,
});

export type Contestant = typeof contestants.$inferSelect;
export type InsertContestant = z.infer<typeof insertContestantSchema>;
export type UpdateContestant = z.infer<typeof updateContestantSchema>;

export type FullContestant = Contestant & { 
  age: number | null;
  outcome: string | null;
  season: string | null;
  franchise: string | null;
  seasonMetadataSourceUrl: string | null;
};

export type Franchise = typeof franchises.$inferSelect;
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;

export type Appearance = typeof appearances.$inferSelect;
export type InsertAppearance = z.infer<typeof insertAppearanceSchema>;

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;

export type ScrapingJobPayload = {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  seasons: z.infer<typeof seasonStatusSchema>[];
  franchises?: z.infer<typeof franchiseStatusSchema>[];
};

export const contestantStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
});

export const seasonStatusSchema = z.object({
  name: z.string(),
  franchiseName: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  progress: z.number().default(0), // 0-100 percentage
  contestants: z.array(contestantStatusSchema).optional(),
});

export const franchiseStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  progress: z.number().default(0), // 0-100 percentage
  seasons: z.array(seasonStatusSchema).optional(),
});

export const progressMessageSchema = z.object({
  jobId: z.string().nullable(),
  status: z.enum(["idle", "running", "completed", "failed"]),
  progress: z.number(),
  totalItems: z.number(),
  currentItem: z.string().optional(),
  message: z.string().optional(),
  screenshot: z.string().optional(),
  seasons: z.array(seasonStatusSchema).optional(),
  franchises: z.array(franchiseStatusSchema).optional(),
  // Enhanced progress fields
  level: z.enum(["full", "franchise", "season", "contestant"]).optional(),
  totalFranchises: z.number().optional(),
  completedFranchises: z.number().optional(),
  totalSeasons: z.number().optional(),
  completedSeasons: z.number().optional(),
  totalContestants: z.number().optional(),
  completedContestants: z.number().optional(),
  currentFranchise: z.string().optional(),
  currentSeason: z.string().optional(),
  currentContestant: z.string().optional(),
});

export type ScrapingProgress = z.infer<typeof progressMessageSchema>;

export interface OldScrapingProgress {
  jobId: string | null;
  status: string;
  progress: number;
  totalItems: number;
  currentItem?: string;
  message?: string;
  screenshot?: string;
  seasons?: z.infer<typeof seasonStatusSchema>[];
}

// Scraping level types for hierarchical scraping
export type ScrapingLevel = 'full' | 'franchise' | 'season' | 'contestant';

export interface ScrapingRequest {
  level: ScrapingLevel;
  franchiseId?: string;
  seasonId?: string;
  contestantId?: string;
  metadataSourceUrl?: string; // Generic metadata source URL for any scraping level
}

export interface AppStats {
  contestants: number;
  seasons: number;
  franchises: number;
  photos: number;
  lastSync?: string;
}
