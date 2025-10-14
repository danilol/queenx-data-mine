import { FranchiseScrapingConfig } from './types';
import { defaultConfig } from './default';
import { dragRaceUSConfig } from './drag-race-us';
import { dragRaceBrasilConfig } from './drag-race-brasil';

// Registry of all franchise configurations
const configRegistry: Map<string, FranchiseScrapingConfig> = new Map([
  ['RuPaul\'s Drag Race', dragRaceUSConfig],
  ['Drag Race Brasil', dragRaceBrasilConfig],
]);

/**
 * Get scraping configuration for a franchise
 * Falls back to default config if no specific config exists
 */
export function getScrapingConfig(franchiseName: string): FranchiseScrapingConfig {
  const config = configRegistry.get(franchiseName);
  if (config) {
    console.log(`[config] Using custom config for franchise: ${franchiseName}`);
    return config;
  }
  console.log(`[config] Using default config for franchise: ${franchiseName}`);
  return defaultConfig;
}

/**
 * Register a new franchise configuration
 */
export function registerConfig(config: FranchiseScrapingConfig): void {
  configRegistry.set(config.franchiseName, config);
  console.log(`[config] Registered config for franchise: ${config.franchiseName}`);
}

// Export all configs for direct access if needed
export { defaultConfig, dragRaceUSConfig, dragRaceBrasilConfig };
export * from './types';
