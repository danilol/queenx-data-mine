import { chromium, Browser, Page } from "playwright";

export interface FandomLookupOptions {
  headless?: boolean;
  timeout?: number;
}

// Helper function to handle cookie consent dialogs on Fandom pages
async function handleCookieConsent(page: Page): Promise<void> {
  try {
    // Look for common cookie consent button selectors used by Fandom
    const consentButtonSelectors = [
      'button:has-text("I Accept")',
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      '[data-tracking-opt-in-accept]',
      '.NN0_TB_DIs498iQlfhIt', // Fandom specific class
      '#onetrust-accept-btn-handler',
      '.accept-all-btn'
    ];

    // Wait briefly for any consent dialog to appear
    await page.waitForTimeout(1000);

    for (const selector of consentButtonSelectors) {
      try {
        // Check if element exists and is visible
        const button = page.locator(selector).first();
        const count = await button.count();
        
        if (count > 0) {
          const isVisible = await button.isVisible().catch(() => false);
          
          if (isVisible) {
            console.log(`[fandom-lookup] Found cookie consent button with selector: ${selector}`);
            await button.click({ timeout: 3000 });
            // Wait a moment for the dialog to close
            await page.waitForTimeout(500);
            console.log('[fandom-lookup] Cookie consent accepted');
            return;
          }
        }
      } catch {
        // Continue to next selector
      }
    }
    
    console.log('[fandom-lookup] No cookie consent dialog found or already accepted');
  } catch (error) {
    console.log('[fandom-lookup] Error handling cookie consent (non-critical):', error);
  }
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

      // Handle cookie consent dialog if present
      await handleCookieConsent(page);

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

    // Handle cookie consent dialog if present
    await handleCookieConsent(page);

    // Wait for the page to load and find biographical information
    const bioInfo: BiographicalInfo = {};

    try {
      // Wait for the aside element (infobox) to load
      await page.waitForSelector('#mw-content-text > div > aside', { timeout: 10000 }).catch(() => {
        console.log(`[fandom-biographical] Aside element not found`);
      });

      // Extract all data items from ALL sections in the aside element
      // This is more resilient than targeting a specific nth-child section
      const data = await page.$$eval('#mw-content-text > div > aside section div[data-source]', (elements) => {
        return elements.map(el => ({
          key: el.getAttribute('data-source') || '',
          label: el.querySelector('h3')?.textContent?.trim() || '',
          value: el.querySelector('div')?.textContent?.trim() || ''
        }));
      }).catch(() => {
        console.log(`[fandom-biographical] No data-source elements found`);
        return [];
      });

      console.log(`[fandom-biographical] Extracted ${data.length} data items from all sections`);

      if (data.length > 0) {
        // Map the extracted data to our fields
        // Prioritize data-source keys (more reliable) over label text
        for (const item of data) {
          const key = item.key.toLowerCase();
          const label = item.label.toLowerCase();
          const value = item.value;

          if (!value) continue; // Skip empty values

          // Map by data-source key first (most reliable)
          if (key.includes('gender')) {
            bioInfo.gender = value;
          } else if (key.includes('pronoun')) {
            bioInfo.pronouns = value;
          } else if (key.includes('height')) {
            bioInfo.height = value;
          } else if (key.includes('birthdate') || key.includes('born') || key.includes('dob') || key.includes('dateofbirth')) {
            bioInfo.dateOfBirth = value;
          } else if (key.includes('birthplace')) {
            bioInfo.birthplace = value;
          } else if (key.includes('residence') || key.includes('location')) {
            bioInfo.location = value;
          } else if (key.includes('hometown')) {
            if (!bioInfo.location) {
              bioInfo.location = value;
            }
          }
          // Fallback to label matching if key didn't match
          else if (label.includes('gender')) {
            bioInfo.gender = value;
          } else if (label.includes('pronoun')) {
            bioInfo.pronouns = value;
          } else if (label.includes('height')) {
            bioInfo.height = value;
          } else if (label.includes('date of birth') || label.includes('dob') || label.includes('born')) {
            if (!bioInfo.dateOfBirth) {
              bioInfo.dateOfBirth = value;
            }
          } else if (label.includes('birthplace')) {
            if (!bioInfo.birthplace) {
              bioInfo.birthplace = value;
            }
          } else if (label.includes('location') && !label.includes('hometown')) {
            if (!bioInfo.location) {
              bioInfo.location = value;
            }
          } else if (label.includes('hometown')) {
            if (!bioInfo.location) {
              bioInfo.location = value;
            }
          }
        }

        const fieldCount = Object.keys(bioInfo).length;
        console.log(`[fandom-biographical] Extracted biographical info (${fieldCount} fields):`, bioInfo);
        
        if (fieldCount === 0) {
          console.warn(`[fandom-biographical] WARNING: Found ${data.length} data items but could not map any to biographical fields. Labels found:`, data.map(d => d.label));
        }
      } else {
        console.log(`[fandom-biographical] No biographical data found in any sections`);
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