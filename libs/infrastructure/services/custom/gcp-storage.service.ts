import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from './config.service';

@Injectable()
export class GcpStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({ projectId: this.configService.gcpProjectId });
    this.bucketName = this.configService.gcpStorageBucket;
  }

  async generateSignedUploadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectName)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + expiresInSeconds * 1000,
        contentType: 'application/octet-stream',
      });
    return url;
  }

  async generateSignedReadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectName)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      });
    return url;
  }

  async deleteObject(objectName: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(objectName).delete();
  }

  async listObjectsByPrefix(prefix: string): Promise<string[]> {
    const [files] = await this.storage
      .bucket(this.bucketName)
      .getFiles({ prefix });
    return files.map((f) => f.name);
  }
}
