import { chromium, Browser, Page } from "playwright";
import { s3Service } from "./s3";
import { broadcastProgress } from "./websocket.js";
import { isImageScrapingEnabled, getConfig } from "../config";
import { db } from "../db";
import { contestants } from "../../shared/schema";
import { eq } from "drizzle-orm";

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
        result.errors.push('No images found on the page');
        return result;
      }

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

          // Download the image
          const response = await page.goto(image.src, { timeout: 15000 });
          
          if (!response || response.status() !== 200) {
            result.errors.push(`Failed to download image: ${image.src}`);
            continue;
          }

          const imageBuffer = await response.body();
          
          // Determine content type and file extension
          const contentType = response.headers()['content-type'] || 'image/jpeg';
          const fileExtension = this.getFileExtension(image.src, contentType);
          
          // Generate a meaningful filename
          const imageName = this.generateImageName(image, i, fileExtension);
          
          // Upload to S3
          const uploadResult = await s3Service.uploadContestantImage(
            imageBuffer,
            contestantName,
            imageName,
            contentType
          );

          result.uploadedImages.push({
            originalUrl: image.src,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            imageName: imageName
          });

          result.imagesDownloaded++;

        } catch (error) {
          const errorMsg = `Failed to process image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
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

export const imageScraper = new ImageScraper();