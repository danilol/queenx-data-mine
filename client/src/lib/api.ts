import { apiRequest } from "./queryClient";
import { Contestant, InsertContestant, UpdateContestant, AppStats, ScrapingJob, Season, FullContestant } from "@shared/schema";

export const api = {
  // Stats
  getStats: async (): Promise<AppStats> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },

  // Contestants
  getContestants: async (search?: string, limit?: number): Promise<FullContestant[]> => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (limit) params.set("limit", limit.toString());
    
    const response = await apiRequest("GET", `/api/contestants${params.toString() ? `?${params}` : ""}`);
    return response.json();
  },

  getContestant: async (id: string): Promise<Contestant> => {
    const response = await apiRequest("GET", `/api/contestants/${id}`);
    return response.json();
  },

  createContestant: async (contestant: InsertContestant): Promise<Contestant> => {
    const response = await apiRequest("POST", "/api/contestants", contestant);
    return response.json();
  },

  updateContestant: async (id: string, contestant: UpdateContestant): Promise<Contestant> => {
    const response = await apiRequest("PATCH", `/api/contestants/${id}`, contestant);
    return response.json();
  },

  deleteContestant: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/contestants/${id}`);
  },

  // Scraping
  getScrapingStatus: async (): Promise<ScrapingJob | { status: string }> => {
    const response = await apiRequest("GET", "/api/scraping/status");
    return response.json();
  },

  startScraping: async (options: { headless?: boolean; screenshotsEnabled?: boolean } = {}) => {
    const response = await apiRequest("POST", "/api/scraping/start", options);
    return response.json();
  },

  stopScraping: async () => {
    const response = await apiRequest("POST", "/api/scraping/stop");
    return response.json();
  },

  getScrapingJobs: async (): Promise<ScrapingJob[]> => {
    const response = await apiRequest("GET", "/api/scraping/jobs");
    return response.json();
  },

  // Export
  exportCSV: () => {
    window.open("/api/export/csv", "_blank");
  },

  exportJSON: () => {
    window.open("/api/export/json", "_blank");
  },
};
