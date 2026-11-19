import { type PrismaClient } from '@prisma/client';
import sharp from 'sharp';

import { type IFileStorageService } from '../../application/interfaces/IFileStorageService.js';
import { logger } from '../../config-middleware/config/logger.js';

import { getRecipeFileKey } from './fileCleanupProcessor.js';
import { type ImageResizeJobData } from './queues/imageResizeQueue.js';

export const THUMBNAIL_SIZE = { width: 300, height: 300 } as const;
export const MEDIUM_SIZE = { width: 800, height: 600 } as const;

export interface ImageResizeDependencies {
  prisma: Pick<PrismaClient, 'recipeImage'>;
  storage: IFileStorageService;
}

export interface ImageResizeResult {
  thumbnailUrl?: string;
  mediumUrl?: string;
}

/** Build a sibling key while preserving the original extension-free basename. */
export function buildVariantKey(originalKey: string, variant: 'thumbnail' | 'medium'): string {
  const slash = originalKey.lastIndexOf('/');
  const directory = slash >= 0 ? originalKey.slice(0, slash + 1) : '';
  const filename = slash >= 0 ? originalKey.slice(slash + 1) : originalKey;
  const base = filename.replace(/\.[^.]+$/, '');
  return `${directory}${base}-${variant}.jpg`;
}

async function renderVariant(
  source: Buffer,
  size: { width: number; height: number },
): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82 })
    .toBuffer();
}

/**
 * FR-JOB-002: download the original recipe image, render 300×300 and 800×600
 * variants, upload them next to the original and write the URLs back to the
 * RecipeImage row. Throwing lets BullMQ retry; the original URL stays usable
 * until the variants are ready, so a permanent failure degrades gracefully.
 */
export async function processImageResize(
  data: ImageResizeJobData,
  dependencies: ImageResizeDependencies,
): Promise<ImageResizeResult> {
  const { prisma, storage } = dependencies;
  const originalKey = getRecipeFileKey(
    data.originalUrl,
    data.recipeId,
    storage.getFileUrl(''),
  );
  if (!originalKey) {
    logger.warn(
      { recipeId: data.recipeId, imageId: data.imageId },
      'Skipping image resize for a URL outside recipe storage',
    );
    return {};
  }

  const source = await storage.downloadFile(originalKey);
  const [thumbnail, medium] = await Promise.all([
    renderVariant(source, THUMBNAIL_SIZE),
    renderVariant(source, MEDIUM_SIZE),
  ]);

  const thumbnailKey = buildVariantKey(originalKey, 'thumbnail');
  const mediumKey = buildVariantKey(originalKey, 'medium');
  let thumbnailUrl: string | undefined;
  let mediumUrl: string | undefined;

  try {
    [thumbnailUrl, mediumUrl] = await Promise.all([
      storage.uploadFile(thumbnailKey, thumbnail, 'image/jpeg'),
      storage.uploadFile(mediumKey, medium, 'image/jpeg'),
    ]);
    await prisma.recipeImage.update({
      where: { id: data.imageId },
      data: { thumbnailUrl, mediumUrl },
    });
  } catch (error) {
    await Promise.allSettled(
      [thumbnailKey, mediumKey].map((key) => storage.deleteFile(key)),
    );
    throw error;
  }

  logger.info(
    { recipeId: data.recipeId, imageId: data.imageId },
    'Recipe image variants generated',
  );
  return { thumbnailUrl, mediumUrl };
}
