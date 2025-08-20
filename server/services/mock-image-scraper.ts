import { s3Service } from "./s3";
import { broadcastProgress } from "./websocket.js";
import { isImageScrapingEnabled } from "../config";
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

export class MockImageScraper {
  // Mock images that would be found on contestant fandom pages
  private readonly mockImages = [
    { 
      name: "promo_photo.jpg", 
      url: "https://static.wikia.nocookie.net/rpdr/images/promo/contestant_promo.jpg",
      description: "Official promo photo"
    },
    { 
      name: "entrance_look.jpg", 
      url: "https://static.wikia.nocookie.net/rpdr/images/entrance/entrance_look.jpg",
      description: "Entrance look"
    },
    { 
      name: "finale_look.jpg", 
      url: "https://static.wikia.nocookie.net/rpdr/images/finale/finale_look.jpg",
      description: "Finale look"
    },
    { 
      name: "runway_look_1.jpg", 
      url: "https://static.wikia.nocookie.net/rpdr/images/runway/look_1.jpg",
      description: "Runway look"
    },
    { 
      name: "runway_look_2.jpg", 
      url: "https://static.wikia.nocookie.net/rpdr/images/runway/look_2.jpg",
      description: "Runway look"
    }
  ];

  // Generate a consistent hash for mock image content
  private generateImageHash(imageName: string, contestantName: string): string {
    return crypto.createHash('md5').update(`${contestantName}_${imageName}`).digest('hex');
  }

  // Generate consistent S3 key based on image hash and contestant name
  private generateS3Key(contestantName: string, imageHash: string, extension: string): string {
    const sanitizedName = contestantName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `contestants/${sanitizedName}/${imageHash}${extension}`;
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

    console.log(`[mock-image-scraper] Starting mock image scraping for ${contestantName}`);
    console.log(`[mock-image-scraper] Source URL: ${metadataSourceUrl}`);

    // Check if image scraping is enabled
    if (!isImageScrapingEnabled()) {
      console.log(`[mock-image-scraper] Image scraping is disabled. Skipping images for ${contestantName}`);
      result.success = true;
      result.errors.push('Image scraping is disabled in configuration');
      return result;
    }

    try {
      // Simulate page load
      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Loading ${contestantName}'s page...`,
        progress: 10,
        totalItems: this.mockImages.length,
        currentItem: 'loading_page'
      });

      await this.sleep(1500);

      // Simulate finding images
      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Searching for images on ${contestantName}'s page...`,
        progress: 30,
        totalItems: this.mockImages.length,
        currentItem: 'finding_images'
      });

      await this.sleep(1000);

      console.log(`[mock-image-scraper] Found ${this.mockImages.length} images for ${contestantName}`);

      broadcastProgress({
        jobId: null,
        status: 'running',
        message: `Found ${this.mockImages.length} images. Starting downloads...`,
        progress: 50,
        totalItems: this.mockImages.length,
        currentItem: 'downloading_images'
      });

      // Process each mock image
      for (let i = 0; i < this.mockImages.length; i++) {
        const mockImage = this.mockImages[i];
        
        try {
          broadcastProgress({
            jobId: null,
            status: 'running',
            message: `Processing ${mockImage.description} (${i + 1} of ${this.mockImages.length})...`,
            progress: 50 + ((i / this.mockImages.length) * 40),
            totalItems: this.mockImages.length,
            currentItem: `image_${i + 1}`
          });

          // Create mock image buffer (small placeholder image data)
          const imageHash = this.generateImageHash(mockImage.name, contestantName);
          const mockImageBuffer = Buffer.from('mock-image-data-' + imageHash, 'utf8');
          
          // Upload mock image using the uploadContestantImage method
          const imageName = `${mockImage.description.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.jpg`;
          
          const uploadResult = await s3Service.uploadContestantImage(
            mockImageBuffer,
            contestantName,
            imageName,
            'image/jpeg'
          );

          result.uploadedImages.push({
            originalUrl: mockImage.url,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            imageName: uploadResult.key.split('/').pop() || 'unknown'
          });

          result.imagesDownloaded++;
          await this.sleep(800);

        } catch (error) {
          const errorMsg = `Failed to process ${mockImage.description}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[mock-image-scraper] ${errorMsg}`);
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
          console.log(`[mock-image-scraper] Updated database with ${imageUrls.length} image URLs for ${contestantName}`);

          broadcastProgress({
            jobId: null,
            status: 'completed',
            message: `Successfully downloaded ${result.imagesDownloaded} images for ${contestantName}`,
            progress: 100,
            totalItems: this.mockImages.length,
            currentItem: 'completed'
          });

        } catch (error) {
          result.errors.push(`Failed to update database: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`[mock-image-scraper] Database update failed:`, error);
        }
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      result.errors.push(errorMsg);
      console.error(`[mock-image-scraper] Failed to scrape images for ${contestantName}:`, errorMsg);
      
      broadcastProgress({
        jobId: null,
        status: 'failed',
        message: `Failed to download images for ${contestantName}: ${errorMsg}`,
        progress: 0,
        totalItems: this.mockImages.length,
        currentItem: 'failed'
      });
    }

    console.log(`[mock-image-scraper] Completed image scraping for ${contestantName}: ${result.imagesDownloaded} images downloaded, ${result.errors.length} errors`);
    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create a singleton instance
export const mockImageScraper = new MockImageScraper();