/**
 * Application configuration settings
 */

export interface AppConfig {
  // Image scraping settings
  imageScraping: {
    enabled: boolean;
    downloadTimeout: number;
    maxFileSize: number; // in bytes
    allowedFormats: string[];
  };
  
  // Scraping settings
  scraping: {
    headless: boolean;
    timeout: number;
    retryAttempts: number;
  };
  
  // Storage settings
  storage: {
    s3Enabled: boolean;
    uploadTimeout: number;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  imageScraping: {
    enabled: process.env.IMAGE_SCRAPING_ENABLED === 'true' || true, // Default to enabled
    downloadTimeout: 30000, // 30 seconds
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  
  scraping: {
    headless: process.env.SCRAPING_HEADLESS !== 'false', // Default to headless
    timeout: 60000, // 60 seconds
    retryAttempts: 3,
  },
  
  storage: {
    s3Enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME),
    uploadTimeout: 30000, // 30 seconds
  },
};

let currentConfig: AppConfig = { ...defaultConfig };

export function getConfig(): AppConfig {
  return currentConfig;
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  currentConfig = {
    ...currentConfig,
    ...updates,
    imageScraping: {
      ...currentConfig.imageScraping,
      ...updates.imageScraping,
    },
    scraping: {
      ...currentConfig.scraping,
      ...updates.scraping,
    },
    storage: {
      ...currentConfig.storage,
      ...updates.storage,
    },
  };
  
  console.log('[config] Configuration updated:', JSON.stringify(currentConfig, null, 2));
  return currentConfig;
}

export function resetConfig(): AppConfig {
  currentConfig = { ...defaultConfig };
  console.log('[config] Configuration reset to defaults');
  return currentConfig;
}

export function isImageScrapingEnabled(): boolean {
  return currentConfig.imageScraping.enabled;
}

export function isS3StorageEnabled(): boolean {
  return currentConfig.storage.s3Enabled;
}