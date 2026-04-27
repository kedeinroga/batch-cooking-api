import { StorageService } from '../../../core/domain-services/services/storage.service';
import { DataSourceException } from '../../../core/domain/exceptions/batch-cooking.exceptions';
import { GcpStorageService } from '../custom/gcp-storage.service';

export class GcpVoucherStorageService extends StorageService {
  constructor(private readonly gcpStorageService: GcpStorageService) {
    super();
  }

  async generateUploadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string> {
    try {
      return await this.gcpStorageService.generateSignedUploadUrl(
        objectName,
        expiresInSeconds,
      );
    } catch (err) {
      throw new DataSourceException(
        `Failed to generate upload URL: ${(err as Error).message}`,
      );
    }
  }

  async generateReadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string> {
    try {
      return await this.gcpStorageService.generateSignedReadUrl(
        objectName,
        expiresInSeconds,
      );
    } catch (err) {
      throw new DataSourceException(
        `Failed to generate read URL: ${(err as Error).message}`,
      );
    }
  }

  async delete(objectName: string): Promise<void> {
    try {
      await this.gcpStorageService.deleteObject(objectName);
    } catch (err) {
      throw new DataSourceException(
        `Failed to delete object: ${(err as Error).message}`,
      );
    }
  }

  async listObjectsByPrefix(prefix: string): Promise<string[]> {
    try {
      return await this.gcpStorageService.listObjectsByPrefix(prefix);
    } catch (err) {
      throw new DataSourceException(
        `Failed to list objects: ${(err as Error).message}`,
      );
    }
  }
}
