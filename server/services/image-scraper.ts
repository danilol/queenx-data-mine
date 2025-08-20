import { chromium, Browser, Page } from "playwright";
import { s3Service } from "./s3";
import { broadcastProgress } from "./websocket.js";
import { isImageScrapingEnabled, getConfig } from "../config";
import { db } from "../db";
import { contestants } from "../../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface ImageScrapingResult {
  success: boolean;
  imagesDownloaded: number;
  uploadedImages: Array<{
    originalUrl: string;
    s3Key: string;
    s3Url: string;
    imageName: string;
  }>;
  errors: string[];
}

export class ImageScraper {
  private browser: Browser | null = null;

  // Generate a consistent hash for image content to prevent duplicates
  private generateImageHash(imageBuffer: Buffer): string {
    return crypto.createHash('md5').update(imageBuffer).digest('hex');
  }

  // Generate consistent S3 key based on image hash and contestant name
  private generateS3Key(contestantName: string, imageHash: string, extension: string): string {
    const sanitizedName = contestantName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `contestants/${sanitizedName}/${imageHash}${extension}`;
  }

  async initialize() {
    try {
      this.browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-notifications',
          '--disable-popup-blocking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-blink-features=AutomationControlled'
        ],
      });
    } catch (error) {
      throw new Error(`Failed to initialize browser: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeContestantImages(
    contestantName: string,
    metadataSourceUrl: string,
    seasonName?: string
  ): Promise<ImageScrapingResult> {
    console.log(`[image-scraper] Starting image scraping for ${contestantName} from ${metadataSourceUrl}`);
    const result: ImageScrapingResult = {
      success: false,
      imagesDownloaded: 0,
      uploadedImages: [],
      errors: []
    };

    // Check if image scraping is enabled
    if (!isImageScrapingEnabled()) {
      console.log(`[image-scraper] Image scraping is disabled. Skipping images for ${contestantName}`);
      result.success = true; // Consider it successful since it's intentionally skipped
      result.errors.push('Image scraping is disabled in configuration');
      return result;
    }

    if (!this.browser) {
      await this.initialize();
    }

    let page: Page | null = null;

    try {
      page = await this.browser!.newPage();
      
      // Set realistic headers to avoid bot detection
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Loading ${contestantName}'s page...`,
        progress: 10,
        totalItems: 1,
        currentItem: 'loading_page'
      });

      await page.goto(metadataSourceUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Handle privacy/consent dialogs that may block content
      console.log(`[image-scraper] Checking for privacy dialogs on ${contestantName}'s page...`);
      
      const privacySelectors = [
        // Common fandom/wikia privacy dialog selectors
        '.oo-ui-processDialog-actions button',
        '.privacy-settings .accept-all',
        '.gdpr-banner button[data-tracking="accept"]',
        '.privacy-banner .accept',
        'button[data-tracking="opt-in-accept"]',
        '.cookie-banner .accept',
        '.consent-banner button',
        // Generic privacy dialog patterns
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Accept")',
        'button:has-text("Agree")',
        'button:has-text("OK")',
        'button:has-text("Continue")',
        '[aria-label*="Accept"]',
        '[aria-label*="Agree"]'
      ];

      for (const selector of privacySelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            console.log(`[image-scraper] Found privacy dialog, clicking: ${selector}`);
            await element.click();
            await page.waitForTimeout(2000); // Wait for dialog to dismiss
            break;
          }
        } catch (error) {
          // Ignore errors for privacy dialog selectors
          continue;
        }
      }

      // Additional wait to ensure page fully loads after privacy dialog
      await page.waitForTimeout(3000);

      // Debug: Log page structure for troubleshooting
      console.log(`[image-scraper] Analyzing page structure for ${contestantName}...`);
      const pageInfo = await page.evaluate(() => {
        const allImages = document.querySelectorAll('img');
        const galleries = document.querySelectorAll('.gallery, .wikia-gallery, .mw-gallery-traditional');
        const tabbers = document.querySelectorAll('.tabber, .tabbertab');
        
        // Get sample of images with their details
        const sampleImages = Array.from(allImages).slice(0, 10).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          className: img.className
        }));
        
        return {
          totalImages: allImages.length,
          galleries: galleries.length,
          tabbers: tabbers.length,
          sampleImages: sampleImages,
          pageTitle: document.title,
          hasContent: document.querySelector('#mw-content-text') ? true : false
        };
      });
      
      console.log(`[image-scraper] Page analysis for ${contestantName}:`, JSON.stringify(pageInfo, null, 2));

      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Searching for images on ${contestantName}'s page...`,
        progress: 30,
        totalItems: 1,
        currentItem: 'finding_images'
      });

      // Simplified approach: Focus on the most common fandom gallery structures
      const imageSelectors = [
        // Primary fandom gallery selectors (most likely to work)
        '.gallery img',
        '.wikia-gallery img', 
        '.mw-gallery img',
        // Content area images
        '#mw-content-text img',
        '.mw-parser-output img',
        // Tabbed content
        '.tabber img',
        '.wds-tabs img',
        // Infobox images  
        '.portable-infobox img',
        '.infobox img'
      ];

      let allImages: any[] = [];
      
      // Try ALL selectors and combine results instead of stopping at first match
      for (const selector of imageSelectors) {
        try {
          const selectorImages = await page.$$eval(selector, (imgs, selectorName) => {
            return imgs.map((img: any) => ({
              src: img.src,
              alt: img.alt || '',
              title: img.title || '',
              selector: selectorName // Track which selector found this image
            })).filter(img => 
              img.src && 
              !img.src.includes('data:') && 
              !img.src.includes('wikia-beacon') &&
              !img.src.includes('scorecardresearch') &&
              (img.src.includes('.jpg') || img.src.includes('.jpeg') || img.src.includes('.png') || img.src.includes('.webp'))
            );
          }, selector);
          
          if (selectorImages.length > 0) {
            console.log(`Found ${selectorImages.length} images with selector: ${selector}`);
            allImages.push(...selectorImages);
          }
        } catch (error) {
          console.log(`[image-scraper] Selector ${selector} failed for ${contestantName}:`, error instanceof Error ? error.message : String(error));
          continue;
        }
      }

      // Remove duplicates based on src URL
      const uniqueImages = allImages.filter((img, index, self) => 
        index === self.findIndex(i => i.src === img.src)
      );
      
      console.log(`[image-scraper] Found total of ${allImages.length} images, ${uniqueImages.length} unique images for ${contestantName}`);
      let images = uniqueImages;

      if (images.length === 0) {
        console.log(`[image-scraper] No images found with specific selectors, trying fallback approach for ${contestantName}`);
        
        // Fallback: Get ALL images and use less restrictive filtering
        try {
          const fallbackImages = await page.$$eval('img', (imgs) => {
            return imgs.map((img: any) => ({
              src: img.src,
              alt: img.alt || '',
              title: img.title || '',
              selector: 'fallback-all-images',
              width: img.width || 0,
              height: img.height || 0
            })).filter(img => {
              // Basic valid image checks
              if (!img.src || img.src.includes('data:') || img.src.includes('wikia-beacon') || img.src.includes('scorecardresearch')) {
                return false;
              }
              
              // Must be a proper image format
              if (!(img.src.includes('.jpg') || img.src.includes('.jpeg') || img.src.includes('.png') || img.src.includes('.webp'))) {
                return false;
              }
              
              // Exclude very small images (likely icons/thumbnails)
              if (img.width > 0 && img.height > 0 && (img.width < 50 || img.height < 50)) {
                return false;
              }
              
              // Exclude obvious UI elements by URL patterns
              if (img.src.includes('/common/') || 
                  img.src.includes('/sitewide/') ||
                  img.src.includes('/ui/') ||
                  img.src.includes('wikia-beacon') ||
                  img.src.includes('favicon') ||
                  img.src.includes('loading') ||
                  img.src.includes('spinner')) {
                return false;
              }
              
              // Include images that are likely content images (less restrictive than before)
              return img.src.includes('images/') || // Fandom image paths
                     img.width >= 100 || // Reasonably sized images
                     img.alt.toLowerCase().includes('look') ||
                     img.alt.toLowerCase().includes('runway') ||
                     img.alt.toLowerCase().includes('outfit') ||
                     img.alt.toLowerCase().includes('drag') ||
                     img.alt.toLowerCase().includes('season') ||
                     img.src.toLowerCase().includes('look') ||
                     img.src.toLowerCase().includes('runway') ||
                     img.src.toLowerCase().includes('outfit');
            });
          });
          
          if (fallbackImages.length > 0) {
            console.log(`[image-scraper] Found ${fallbackImages.length} images using fallback method for ${contestantName}`);
            images = fallbackImages;
          }
        } catch (fallbackError) {
          console.error(`[image-scraper] Fallback image detection failed for ${contestantName}:`, fallbackError);
        }
      }

      if (images.length === 0) {
        console.log(`[image-scraper] No images found for ${contestantName} on page ${metadataSourceUrl}`);
        result.errors.push('No images found on the page');
        return result;
      }
      console.log(`[image-scraper] Found a total of ${images.length} potential images for ${contestantName}.`);

      // Filter for season-specific images if seasonName is provided
      if (seasonName) {
        const seasonNumber = seasonName.match(/\d+/)?.[0];
        if (seasonNumber) {
          images = images.filter(img => 
            img.alt.toLowerCase().includes(`season ${seasonNumber}`) ||
            img.alt.toLowerCase().includes(`s${seasonNumber}`) ||
            img.src.toLowerCase().includes(`season${seasonNumber}`) ||
            img.src.toLowerCase().includes(`s${seasonNumber}`)
          );
        }
      }

      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Found ${images.length} images. Starting downloads...`,
        progress: 50,
        totalItems: images.length,
        currentItem: 'downloading_images'
      });

      // Download and upload each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
          broadcastProgress({
            jobId: null,
            status: 'running',
            message: `Downloading image ${i + 1} of ${images.length}...`,
            progress: 50 + ((i / images.length) * 40),
            totalItems: images.length,
            currentItem: `image_${i + 1}`
          });

          console.log(`[image-scraper] Downloading image for ${contestantName} from: ${image.src}`);
          
          // Try multiple URL variants for better success rate
          const urlsToTry = [
            image.src, // Original URL
            image.src.split('/revision/')[0], // Remove revision part
            image.src.replace(/\/scale-to-width-down\/\d+/, ''), // Remove scale parameters
            image.src.replace(/\/zoom-crop\/width\/\d+\/height\/\d+/, '') // Remove crop parameters
          ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

          let response = null;
          let lastError = null;
          
          for (const urlToTry of urlsToTry) {
            try {
              console.log(`[image-scraper] Trying URL for ${contestantName}: ${urlToTry}`);
              response = await page.goto(urlToTry, { timeout: 30000 });
              
              if (response && response.status() === 200) {
                console.log(`[image-scraper] Successfully downloaded from: ${urlToTry}`);
                break;
              } else {
                console.log(`[image-scraper] URL failed with status ${response?.status()}: ${urlToTry}`);
                lastError = `HTTP ${response?.status()} for ${urlToTry}`;
              }
            } catch (error) {
              console.log(`[image-scraper] URL attempt failed: ${urlToTry}`, error);
              lastError = error instanceof Error ? error.message : String(error);
              continue;
            }
          }
          
          if (!response || response.status() !== 200) {
            const errorMsg = `Failed to download image from any URL variant: ${image.src} (last error: ${lastError})`;
            console.error(`[image-scraper] ${errorMsg}`);
            result.errors.push(errorMsg);
            continue;
          }

          const imageBuffer = await response.body();
          
          // Determine content type and file extension
          const contentType = response.headers()['content-type'] || 'image/jpeg';
          const fileExtension = this.getFileExtension(image.src, contentType);
          
          // Generate hash-based key to prevent duplicates
          const imageHash = this.generateImageHash(imageBuffer);
          const s3Key = this.generateS3Key(contestantName, imageHash, fileExtension);
          
          // Check if this image already exists in S3
          const existsInS3 = await s3Service.fileExists(s3Key);
          
          let uploadResult;
          if (existsInS3) {
            console.log(`Image already exists in S3, skipping upload: ${s3Key}`);
            // Still track it as part of this contestant's images
            uploadResult = {
              key: s3Key,
              url: s3Service.getPublicUrl(s3Key)
            };
          } else {
            // Upload new image to S3 with hash-based key
            uploadResult = await s3Service.uploadWithKey(
              imageBuffer,
              s3Key,
              contentType
            );
            console.log(`Uploaded new image: ${s3Key}`);
          }

          result.uploadedImages.push({
            originalUrl: image.src,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            imageName: s3Key.split('/').pop() || 'unknown'
          });

          result.imagesDownloaded++;

        } catch (error) {
          const errorMsg = `Failed to process image ${i + 1} (${image.src}):`;
          console.error(errorMsg, error); // Log the full error object
          console.error(`[image-scraper] Full error details for ${contestantName}:`, {
            imageUrl: image.src,
            cleanedUrl: image.src.split('/revision/')[0],
            imageAlt: image.alt,
            imageTitle: image.title,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
          result.errors.push(`${errorMsg} ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.imagesDownloaded > 0;

      // Update database with image information
      if (result.success) {
        try {
          const { DrizzleStorage } = await import('../storage.js');
          const storage = new DrizzleStorage();
          const imageUrls = result.uploadedImages.map(img => img.s3Url);
          await storage.updateContestantImages(contestantName, imageUrls);
          console.log(`[image-scraper] Updated database with ${imageUrls.length} image URLs for ${contestantName}`);
        } catch (error) {
          console.error(`[image-scraper] Failed to update database for ${contestantName}:`, error);
          result.errors.push(`Failed to update database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      broadcastProgress({
        jobId: null,
        status: 'completed',
        message: `Successfully downloaded ${result.imagesDownloaded} images for ${contestantName}`,
        progress: 100,
        totalItems: result.imagesDownloaded,
        currentItem: 'completed'
      });

    } catch (error) {
      const errorMsg = `Image scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
      
      broadcastProgress({
        jobId: null,
        status: 'failed',
        message: errorMsg,
        progress: 0,
        totalItems: 0,
        currentItem: 'error'
      });
    } finally {
      if (page) {
        await page.close();
      }
    }

    return result;
  }

  private getFileExtension(url: string, contentType: string): string {
    // Try to get extension from URL first
    const urlExtension = url.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1];
    if (urlExtension) {
      return urlExtension.toLowerCase();
    }

    // Fallback to content type
    switch (contentType.toLowerCase()) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      default:
        return 'jpg';
    }
  }

  private generateImageName(image: any, index: number, extension: string): string {
    // Try to create a meaningful name from alt text or title
    let name = image.alt || image.title || '';
    
    // Clean the name
    name = name.replace(/[^a-zA-Z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .toLowerCase()
              .substring(0, 50); // Limit length

    // If no meaningful name, use a generic one
    if (!name) {
      name = `look-${index + 1}`;
    }

    return `${name}.${extension}`;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Create fallback to mock scraper when Playwright is not available
let scraper: ImageScraper | null = null;

async function getImageScraper() {
  if (!scraper) {
    scraper = new ImageScraper();
    try {
      await scraper.initialize();
    } catch (error) {
      console.log("[image-scraper] Playwright not available, using mock image scraper:", error instanceof Error ? error.message : 'Unknown error');
      // Import and return mock scraper
      const { mockImageScraper } = await import('./mock-image-scraper.js');
      return mockImageScraper;
    }
  }
  return scraper;
}

export const imageScraper = {
  async scrapeContestantImages(contestantName: string, metadataSourceUrl: string, seasonName?: string) {
    const scraper = await getImageScraper();
    return scraper.scrapeContestantImages(contestantName, metadataSourceUrl, seasonName);
  },

  // Debug function to analyze page structure for specific contestants
  async debugPageStructure(contestantName: string, metadataSourceUrl: string) {
    console.log(`[image-scraper] Starting debug analysis for ${contestantName}`);
    
    if (!scraper || !(scraper instanceof ImageScraper)) {
      console.log("[image-scraper] Playwright not available for debugging");
      return { error: "Playwright not available" };
    }

    let page: Page | null = null;
    try {
      // Access browser through the scraper instance (we need to make browser public or add a getter)
      if (!scraper['browser']) {
        await scraper.initialize();
      }
      page = await scraper['browser']!.newPage();
      await page.goto(metadataSourceUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Analyze page structure
      const pageInfo = await page.evaluate(() => {
        const galleries = document.querySelectorAll('.gallery, .wikia-gallery, .mw-gallery-traditional');
        const tabbers = document.querySelectorAll('.tabber, .tabbertab');
        const infoboxes = document.querySelectorAll('.portable-infobox, .infobox');
        const allImages = document.querySelectorAll('img');
        
        return {
          totalImages: allImages.length,
          galleries: galleries.length,
          tabbers: tabbers.length,
          infoboxes: infoboxes.length,
          imagesByType: {
            galleryImages: document.querySelectorAll('.gallery img, .wikia-gallery img').length,
            tabberImages: document.querySelectorAll('.tabber img, .tabbertab img').length,
            infoboxImages: document.querySelectorAll('.portable-infobox img, .infobox img').length,
            contentImages: document.querySelectorAll('#mw-content-text img').length
          }
        };
      });
      
      console.log(`[image-scraper] Page structure for ${contestantName}:`, pageInfo);
      return pageInfo;
      
    } catch (error) {
      console.error(`[image-scraper] Debug failed for ${contestantName}:`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
};