import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const contestants = pgTable("contestants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dragName: text("drag_name").notNull(),
  realName: text("real_name"),
  age: integer("age"),
  hometown: text("hometown"),
  season: text("season").notNull(),
  franchise: text("franchise").notNull().default("US"),
  outcome: text("outcome"),
  biography: text("biography"),
  photoUrl: text("photo_url"),
  wikipediaUrl: text("wikipedia_url"),
  isScraped: boolean("is_scraped").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  franchise: text("franchise").notNull(),
  year: integer("year"),
  wikipediaUrl: text("wikipedia_url"),
  isScraped: boolean("is_scraped").default(false),
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

export const insertContestantSchema = createInsertSchema(contestants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContestantSchema = insertContestantSchema.partial();

export const insertSeasonSchema = createInsertSchema(seasons).omit({
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

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapingJob = z.infer<typeof insertScrapingJobSchema>;

export interface ScrapingProgress {
  jobId: string;
  status: string;
  progress: number;
  totalItems: number;
  currentItem?: string;
  screenshot?: string;
  message?: string;
}

export interface AppStats {
  contestants: number;
  seasons: number;
  franchises: number;
  photos: number;
  lastSync?: string;
}
