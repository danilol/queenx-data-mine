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
          '--disable-features=VizDisplayCompositor'
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
      
      // Set user agent to avoid blocking
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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

      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Searching for images on ${contestantName}'s page...`,
        progress: 30,
        totalItems: 1,
        currentItem: 'finding_images'
      });

      // Look for section containing looks/runway images
      const imageSelectors = [
        // Fandom wiki specific selectors for drag race looks
        '.wikia-gallery-item img',
        '.gallery img',
        '.mw-gallery-traditional img',
        '#mw-content-text .wikia-gallery-item .image img',
        '#mw-content-text .gallery .image img',
        '#mw-content-text .thumb .image img',
        '#mw-content-text .image img', // More generic fallback within the content area
        // More generic selectors as fallback
        'img[src*="look"]',
        'img[src*="runway"]',
        'img[src*="outfit"]',
        'img[alt*="look"]',
        'img[alt*="runway"]',
        'img[alt*="outfit"]'
      ];

      let images: any[] = [];
      
      // Try each selector until we find images
      for (const selector of imageSelectors) {
        try {
          images = await page.$$eval(selector, (imgs) => {
            return imgs.map((img: any) => ({
              src: img.src,
              alt: img.alt || '',
              title: img.title || ''
            })).filter(img => 
              img.src && 
              !img.src.includes('data:') && 
              (img.src.includes('.jpg') || img.src.includes('.jpeg') || img.src.includes('.png') || img.src.includes('.webp'))
            );
          });
          
          if (images.length > 0) {
            console.log(`Found ${images.length} images with selector: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`Selector ${selector} failed:`, error);
          continue;
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
          // Download the image
          // Clean the URL to remove resizing/versioning parameters
          const cleanedUrl = image.src.split('/revision/')[0];
          console.log(`[image-scraper] Downloading cleaned image for ${contestantName} from: ${cleanedUrl}`);

          const response = await page.goto(cleanedUrl, { timeout: 15000 });
          
          if (!response || response.status() !== 200) {
            result.errors.push(`Failed to download image: ${image.src}`);
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
  }
};