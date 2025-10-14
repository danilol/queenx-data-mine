import { apiRequest } from "./queryClient";
import { Contestant, InsertContestant, UpdateContestant, AppStats, ScrapingJob, Season, FullContestant, Franchise, ScrapingProgress } from "@shared/schema";

export const api = {
  // Stats
  getStats: async (): Promise<AppStats> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },

  // Contestants
  getContestants: async (options: { search?: string; limit?: number; seasonId?: string } = {}): Promise<FullContestant[]> => {
    const params = new URLSearchParams();
    if (options.search) params.set("search", options.search);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.seasonId) params.set("seasonId", options.seasonId);
    
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
  getScrapingStatus: async (): Promise<{ status: ScrapingJob | null }> => {
    const response = await apiRequest("GET", "/api/scrape/status");
    return response.json();
  },

  startScraping: async (request: { level?: string; contestantId?: string; seasonId?: string; franchiseId?: string; sourceUrl?: string }, options?: { headless?: boolean; screenshotsEnabled?: boolean }) => {
    // Route to the correct specific endpoint based on the request
    if (request.contestantId) {
      return apiRequest("POST", "/api/scrape/contestant", { contestantId: request.contestantId, options });
    } else if (request.seasonId) {
      return apiRequest("POST", "/api/scrape/season", { seasonId: request.seasonId, options });
    } else if (request.franchiseId) {
      return apiRequest("POST", "/api/scrape/franchise", { franchiseId: request.franchiseId, options });
    } else if (request.level === 'season' && request.sourceUrl) {
      // For season scraping by sourceUrl, need to find the seasonId first
      // This is a temporary workaround - ideally components should pass seasonId
      throw new Error("Season scraping requires seasonId. Please use the specific scraping button.");
    } else if (request.level === 'contestant' && request.contestantId) {
      return apiRequest("POST", "/api/scrape/contestant", { contestantId: request.contestantId, options });
    } else {
      return apiRequest("POST", "/api/scrape/full", { options });
    }
  },

  startFullScraping: async (options: { headless?: boolean; screenshotsEnabled?: boolean }) => {
    return apiRequest("POST", "/api/scrape/full", { options });
  },

  startFranchiseScraping: async (franchiseId: string, options: { headless?: boolean; screenshotsEnabled?: boolean }) => {
    return apiRequest("POST", "/api/scrape/franchise", { franchiseId, options });
  },

  startSeasonScraping: async (seasonId: string, options: { headless?: boolean; screenshotsEnabled?: boolean }) => {
    return apiRequest("POST", "/api/scrape/season", { seasonId, options });
  },

  startContestantScraping: async (contestantId: string, options: { headless?: boolean; screenshotsEnabled?: boolean }) => {
    return apiRequest("POST", "/api/scrape/contestant", { contestantId, options });
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

  // Image scraping functions
  scrapeContestantImages: async (contestantData: {
    contestantId?: string;
    contestantName: string;
    sourceUrl: string;
    seasonName?: string;
  }) => {
    const response = await apiRequest("POST", "/api/images/scrape-contestant", contestantData);
    return response.json();
  },
};
