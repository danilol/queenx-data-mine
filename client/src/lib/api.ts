import { apiRequest } from "./queryClient";
import { Contestant, InsertContestant, UpdateContestant, AppStats, ScrapingJob, Season, FullContestant, Franchise, ScrapingProgress } from "@shared/schema";

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

  // Franchises
  getFranchises: async (): Promise<Franchise[]> => {
    const response = await apiRequest("GET", "/api/franchises");
    return response.json();
  },

  // Seasons
  getSeasons: async (options: {
    franchiseId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  } = {}): Promise<Season[]> => {
    const params = new URLSearchParams();
    if (options.franchiseId) params.set("franchiseId", options.franchiseId);
    if (options.sortBy) params.set("sortBy", options.sortBy);
    if (options.sortOrder) params.set("sortOrder", options.sortOrder);
    if (options.search) params.set("search", options.search);
    
    const response = await apiRequest("GET", `/api/seasons${params.toString() ? `?${params}` : ""}`);
    return response.json();
  },

  // Scraping
  getScrapingStatus: async (): Promise<ScrapingProgress> => {
    const response = await apiRequest("GET", "/api/scraping/status");
    return response.json();
  },

  startScraping: async (options: { headless?: boolean; screenshotsEnabled?: boolean; level?: string; franchiseId?: string; seasonId?: string; contestantId?: string; sourceUrl?: string } = {}) => {
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

  // S3 upload functions
  uploadFileToS3: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch('/api/s3/upload', {
      method: 'POST',
      body: formData,
    }).then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.error || 'Upload failed');
        });
      }
      return res.json();
    });
  },

  testS3Connection: async () => {
    const response = await apiRequest("POST", "/api/s3/test");
    return response.json();
  },
};
