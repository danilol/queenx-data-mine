import { chromium, Browser, Page } from "playwright";

export interface FandomLookupOptions {
  headless?: boolean;
  timeout?: number;
}

export class FandomLookup {
  private browser: Browser | null = null;

  async initialize(options: FandomLookupOptions = {}) {
    try {
      this.browser = await chromium.launch({
        executablePath: '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
        headless: options.headless ?? true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
      });
    } catch (error) {
      throw new Error(`Failed to initialize browser for fandom lookup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findContestantFandomUrl(contestantName: string, options: FandomLookupOptions = {}): Promise<string | null> {
    try {
      if (!this.browser) {
        await this.initialize(options);
      }

      if (!this.browser) {
        console.error('Browser initialization failed for fandom lookup');
        return null;
      }
    } catch (initError) {
      // Re-throw initialization error so getFandomUrl can catch and use fallback
      throw initError;
    }

    const page = await this.browser.newPage();
    
    try {
      // Search for the contestant on the RuPaul's Drag Race Fandom wiki
      const searchUrl = `https://rupaulsdragrace.fandom.com/wiki/Special:Search?query=${encodeURIComponent(contestantName)}&scope=internal&navigationSearch=true`;
      
      console.log(`[fandom-lookup] Searching for contestant: ${contestantName}`);
      console.log(`[fandom-lookup] Search URL: ${searchUrl}`);
      
      // Use 'domcontentloaded' for Fandom pages (they have heavy ads that prevent networkidle)
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: options.timeout || 60000 
      });

      // Wait for search results to load
      await page.waitForSelector('.unified-search__results', { timeout: 5000 }).catch(() => {
        console.log('[fandom-lookup] Unified search results not found, trying alternative selectors');
      });

      // Look for direct page match first (if we're redirected to the exact page)
      const currentUrl = page.url();
      if (currentUrl.includes('/wiki/') && !currentUrl.includes('Special:Search') && !currentUrl.includes('search=')) {
        console.log(`[fandom-lookup] Found direct match: ${currentUrl}`);
        await page.close();
        return currentUrl;
      }

      // Try to find the first search result that matches the contestant name
      const searchResults = await page.$$eval('a[href*="/wiki/"]:not([href*="Special:"])', (links, name) => {
        return links
          .filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement)
          .map(link => ({
            href: link.href,
            text: link.textContent?.trim() || '',
            title: link.getAttribute('title') || ''
          }))
          .filter(link => {
            const linkText = link.text.toLowerCase();
            const linkTitle = link.title.toLowerCase();
            const searchName = name.toLowerCase();
            
            // Check if the link text or title contains the contestant name
            return linkText.includes(searchName) || 
                   linkTitle.includes(searchName) ||
                   // Handle variations like "Bianca Del Rio" vs "Bianca"
                   searchName.split(' ').some(part => 
                     part.length > 2 && (linkText.includes(part) || linkTitle.includes(part))
                   );
          })
          .slice(0, 5); // Take top 5 matches for evaluation
      }, contestantName);

      console.log(`[fandom-lookup] Found ${searchResults.length} potential matches for ${contestantName}`);
      
      if (searchResults.length > 0) {
        // Prefer exact matches or close matches
        const bestMatch = searchResults.find(result => {
          const text = result.text.toLowerCase();
          const name = contestantName.toLowerCase();
          return text === name || text.replace(/[^\w\s]/g, '') === name.replace(/[^\w\s]/g, '');
        }) || searchResults[0];

        console.log(`[fandom-lookup] Best match for ${contestantName}: ${bestMatch.href}`);
        await page.close();
        return bestMatch.href;
      }

      // Try alternative search approach - look for article links in search results
      const articleLinks = await page.$$eval('.unified-search__result__title a, .mw-search-result-heading a', 
        (links, name) => {
          return links
            .filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement)
            .map(link => link.href)
            .filter(href => href.includes('/wiki/') && !href.includes('Special:'))
            .slice(0, 3);
        }, contestantName).catch(() => []);

      if (articleLinks.length > 0) {
        console.log(`[fandom-lookup] Found article link for ${contestantName}: ${articleLinks[0]}`);
        await page.close();
        return articleLinks[0];
      }

      console.log(`[fandom-lookup] No suitable fandom URL found for contestant: ${contestantName}`);
      await page.close();
      return null;

    } catch (error) {
      console.error(`[fandom-lookup] Error searching for ${contestantName}:`, error);
      await page.close();
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Helper function to normalize contestant names for better search results
export function normalizeContestantName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Singleton instance for reuse
let fandomLookupInstance: FandomLookup | null = null;

// Fallback function to construct fandom URL from contestant name
function constructFandomUrl(contestantName: string): string | null {
  try {
    // Clean up the name for URL
    const cleanName = contestantName
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores
    
    if (!cleanName) return null;
    
    const fandomUrl = `https://rupaulsdragrace.fandom.com/wiki/${encodeURIComponent(cleanName)}`;
    console.log(`[fandom-lookup] Constructed fallback URL for ${contestantName}: ${fandomUrl}`);
    return fandomUrl;
  } catch (error) {
    console.error(`[fandom-lookup] Error constructing fandom URL for ${contestantName}:`, error);
    return null;
  }
}

export async function getFandomUrl(contestantName: string, options: FandomLookupOptions = {}): Promise<string | null> {
  if (!fandomLookupInstance) {
    fandomLookupInstance = new FandomLookup();
  }
  
  try {
    return await fandomLookupInstance.findContestantFandomUrl(contestantName, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[fandom-lookup] Browser-based lookup failed for ${contestantName}, using fallback:`, errorMessage);
    
    // If browser fails (like missing Playwright dependencies), use fallback URL construction
    return constructFandomUrl(contestantName);
  }
}

export async function closeFandomLookup() {
  if (fandomLookupInstance) {
    await fandomLookupInstance.close();
    fandomLookupInstance = null;
  }
}

// Interface for biographical information
export interface BiographicalInfo {
  gender?: string;
  pronouns?: string;
  height?: string;
  dateOfBirth?: string;
  birthplace?: string;
  location?: string;
}

// Extract biographical information from a Fandom contestant page
export async function extractBiographicalInfo(fandomUrl: string, options: FandomLookupOptions = {}): Promise<BiographicalInfo | null> {
  let browser = null;
  try {
    const config = await import('../config').then(m => m.getConfig());
    const launchOptions: Parameters<typeof chromium.launch>[0] = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    };

    if (config.scraping.chromiumExecutablePath) {
      launchOptions.executablePath = config.scraping.chromiumExecutablePath;
    }

    browser = await chromium.launch(launchOptions);
    const page = await browser.newPage();

    console.log(`[fandom-biographical] Extracting biographical info from: ${fandomUrl}`);

    // Navigate to the Fandom page
    await page.goto(fandomUrl, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout || 60000
    });

    // Wait for the biographical section to load
    // Selector: #mw-content-text > div > aside > section:nth-child(3)
    const bioInfo: BiographicalInfo = {};

    try {
      // Try to find the biographical information section
      const bioSection = await page.$('#mw-content-text > div > aside > section:nth-child(3)');
      
      if (bioSection) {
        console.log(`[fandom-biographical] Found biographical section`);

        // Extract all data items from the section
        const data = await bioSection.$$eval('div[data-source]', (elements) => {
          return elements.map(el => ({
            key: el.getAttribute('data-source') || '',
            label: el.querySelector('h3')?.textContent?.trim() || '',
            value: el.querySelector('div')?.textContent?.trim() || ''
          }));
        });

        console.log(`[fandom-biographical] Extracted data items:`, data);

        // Map the extracted data to our fields
        for (const item of data) {
          const label = item.label.toLowerCase();
          const value = item.value;

          if (label.includes('gender')) {
            bioInfo.gender = value;
          } else if (label.includes('pronoun')) {
            bioInfo.pronouns = value;
          } else if (label.includes('height')) {
            bioInfo.height = value;
          } else if (label.includes('date of birth') || label.includes('dob')) {
            bioInfo.dateOfBirth = value;
          } else if (label.includes('birthplace')) {
            bioInfo.birthplace = value;
          } else if (label.includes('location') && !label.includes('hometown')) {
            bioInfo.location = value;
          } else if (label.includes('hometown')) {
            // Store in location if we don't have it yet
            if (!bioInfo.location) {
              bioInfo.location = value;
            }
          }
        }

        console.log(`[fandom-biographical] Extracted biographical info:`, bioInfo);
      } else {
        console.log(`[fandom-biographical] Biographical section not found`);
      }
    } catch (sectionError) {
      console.error(`[fandom-biographical] Error extracting biographical section:`, sectionError);
    }

    await browser.close();
    return Object.keys(bioInfo).length > 0 ? bioInfo : null;

  } catch (error) {
    console.error(`[fandom-biographical] Error extracting biographical info:`, error);
    if (browser) {
      await browser.close();
    }
    return null;
  }
}