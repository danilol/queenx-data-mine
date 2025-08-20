import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    // Validate required environment variables
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET_NAME || '';

    if (!accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new Error('Missing required S3 configuration. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables.');
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'application/octet-stream'
  ): Promise<{ key: string; url: string }> {
    try {
      // Generate a unique key for the file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `uploads/${timestamp}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      // Return the key and constructed URL
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      
      return { key, url };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadContestantImage(
    fileBuffer: Buffer,
    contestantName: string,
    imageName: string,
    contentType: string = 'image/jpeg'
  ): Promise<{ key: string; url: string }> {
    try {
      // Clean contestant name for safe file paths
      const safeName = contestantName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `contestants/${safeName}/images/${timestamp}-${imageName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      // Return the key and constructed URL
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      
      return { key, url };
    } catch (error) {
      console.error('S3 contestant image upload error:', error);
      throw new Error(`Failed to upload contestant image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadTestFile(): Promise<{ key: string; url: string }> {
    // Create a simple test file
    const testContent = JSON.stringify({
      message: 'S3 connection test successful',
      timestamp: new Date().toISOString(),
      bucketName: this.bucketName,
    }, null, 2);

    const buffer = Buffer.from(testContent, 'utf-8');
    
    return this.uploadFile(buffer, 'test-connection.json', 'application/json');
  }

  async uploadWithKey(
    fileBuffer: Buffer,
    key: string,
    contentType: string = 'application/octet-stream'
  ): Promise<{ key: string; url: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await this.client.send(command);

      // Return the key and constructed URL
      const url = this.getPublicUrl(key);
      
      return { key, url };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      return true; // File exists
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false; // File does not exist
      }
      // Re-throw other errors (like permission issues)
      throw error;
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.uploadTestFile();
      return {
        success: true,
        message: 'S3 connection successful! Test file uploaded.',
      };
    } catch (error) {
      return {
        success: false,
        message: `S3 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const s3Service = new S3Service();