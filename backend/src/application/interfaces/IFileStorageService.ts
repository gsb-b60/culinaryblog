export interface IFileStorageService {
  uploadFile(
    key: string,
    body: Buffer | ReadableStream | Blob,
    contentType: string
  ): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFileUrl(key: string): string;
  generatePresignedUrl(key: string, expiresIn: number): Promise<string>;
}