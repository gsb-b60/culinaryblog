import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { IFileStorageService } from '../../application/interfaces/IFileStorageService.js';
import { env } from '../../config-middleware/config/env.js';

export class MinioFileStorageService implements IFileStorageService {
  private client: S3Client;

  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY!,
        secretAccessKey: env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
    this.bucket = env.S3_BUCKET!;
  }

  async uploadFile(
    key: string,
    body: Buffer | ReadableStream | Blob,
    contentType: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body as any,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.client.send(command);
    return this.getFileUrl(key);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      // Ignore if file doesn't exist (idempotent)
      console.warn(`Failed to delete file ${key}:`, error);
    }
  }

  getFileUrl(key: string): string {
    const endpoint = env.S3_ENDPOINT!.replace(/\/$/, '');
    return `${endpoint}/${this.bucket}/${key}`;
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}