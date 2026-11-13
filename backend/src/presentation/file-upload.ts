import { randomUUID } from 'node:crypto';

import { fileTypeFromBuffer } from 'file-type';

import { AppError } from '../config-middleware/shared/errors/AppError.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export interface DetectedImage {
  mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  extension: 'jpg' | 'png' | 'webp' | 'avif';
}

export async function detectAllowedImage(buffer: Buffer): Promise<DetectedImage> {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_IMAGE_TYPES.has(detected.mime)) {
    throw new AppError(
      400,
      'Only JPEG, PNG, WebP, and AVIF images are accepted.',
      'FILE_MIME_INVALID',
      { type: 'FILE_MIME_INVALID', title: 'Invalid file type' },
    );
  }

  const mime = detected.mime as DetectedImage['mime'];
  let extension: DetectedImage['extension'] = 'jpg';
  switch (mime) {
    case 'image/jpeg':
      extension = 'jpg';
      break;
    case 'image/png':
      extension = 'png';
      break;
    case 'image/webp':
      extension = 'webp';
      break;
    case 'image/avif':
      extension = 'avif';
      break;
  }

  return { mime, extension };
}

export function buildImageKey(recipeId: string, extension: DetectedImage['extension']): string {
  return `recipes/${recipeId}/${randomUUID()}.${extension}`;
}

export function assertImageSize(size: number): void {
  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(
      400,
      'Image must be 5 MB or smaller.',
      'FILE_SIZE_EXCEEDED',
      { type: 'FILE_SIZE_EXCEEDED', title: 'File too large' },
    );
  }
}
