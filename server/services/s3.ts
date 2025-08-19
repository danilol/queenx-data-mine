import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
}

export const s3Service = new S3Service();