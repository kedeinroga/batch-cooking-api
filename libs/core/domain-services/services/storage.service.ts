export abstract class StorageService {
  abstract generateUploadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string>;
  abstract generateReadUrl(
    objectName: string,
    expiresInSeconds: number,
  ): Promise<string>;
  abstract delete(objectName: string): Promise<void>;
  abstract listObjectsByPrefix(prefix: string): Promise<string[]>;
}
