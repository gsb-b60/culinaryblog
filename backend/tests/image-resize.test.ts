import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildVariantKey,
  MEDIUM_SIZE,
  processImageResize,
  THUMBNAIL_SIZE,
} from '../src/infrastructure/jobs/imageResizeProcessor.js';

const baseUrl = 'http://localhost:9000/lethimcook/';
const originalUrl = `${baseUrl}recipes/r1/original.png`;
const source = await sharp({
  create: { width: 1200, height: 900, channels: 3, background: '#c0392b' },
})
  .png()
  .toBuffer();

function createStorage() {
  return {
    uploadFile: vi.fn(async (key: string) => `${baseUrl}${key}`),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    downloadFile: vi.fn().mockResolvedValue(source),
    getFileUrl: vi.fn((key: string) => `${baseUrl}${key}`),
    generatePresignedUrl: vi.fn(),
  };
}

function createPrisma() {
  return {
    recipeImage: {
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FR-JOB-002 image variant generation', () => {
  it('builds sibling keys without changing the original extension', () => {
    expect(buildVariantKey('recipes/r1/abc.png', 'thumbnail')).toBe(
      'recipes/r1/abc-thumbnail.jpg',
    );
    expect(buildVariantKey('recipes/r1/abc.webp', 'medium')).toBe(
      'recipes/r1/abc-medium.jpg',
    );
  });

  it('stores 300x300 and 800x600 JPEG variants and writes URLs to the image row', async () => {
    const storage = createStorage();
    const prisma = createPrisma();

    const result = await processImageResize(
      { recipeId: 'r1', imageId: 'i1', originalUrl },
      { storage, prisma },
    );

    expect(storage.downloadFile).toHaveBeenCalledWith('recipes/r1/original.png');
    expect(storage.uploadFile).toHaveBeenCalledTimes(2);

    const uploads = storage.uploadFile.mock.calls.map(([key, buffer]) => ({
      key,
      buffer: buffer as Buffer,
    }));
    const thumbnail = uploads.find(({ key }) => key.endsWith('-thumbnail.jpg'));
    const medium = uploads.find(({ key }) => key.endsWith('-medium.jpg'));
    expect(thumbnail).toBeDefined();
    expect(medium).toBeDefined();

    const thumbnailMeta = await sharp(thumbnail!.buffer).metadata();
    expect(thumbnailMeta).toMatchObject({
      width: THUMBNAIL_SIZE.width,
      height: THUMBNAIL_SIZE.height,
      format: 'jpeg',
    });
    const mediumMeta = await sharp(medium!.buffer).metadata();
    expect(mediumMeta).toMatchObject({
      width: MEDIUM_SIZE.width,
      height: MEDIUM_SIZE.height,
      format: 'jpeg',
    });

    expect(prisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: {
        thumbnailUrl: `${baseUrl}recipes/r1/original-thumbnail.jpg`,
        mediumUrl: `${baseUrl}recipes/r1/original-medium.jpg`,
      },
    });
    expect(result).toEqual({
      thumbnailUrl: `${baseUrl}recipes/r1/original-thumbnail.jpg`,
      mediumUrl: `${baseUrl}recipes/r1/original-medium.jpg`,
    });
  });

  it('skips gracefully when the URL belongs to another storage location', async () => {
    const storage = createStorage();
    const prisma = createPrisma();

    const result = await processImageResize(
      { recipeId: 'r1', imageId: 'i1', originalUrl: 'https://example.com/photo.jpg' },
      { storage, prisma },
    );

    expect(result).toEqual({});
    expect(storage.downloadFile).not.toHaveBeenCalled();
    expect(storage.uploadFile).not.toHaveBeenCalled();
    expect(prisma.recipeImage.update).not.toHaveBeenCalled();
  });

  it('removes generated variants when the database write fails', async () => {
    const storage = createStorage();
    const prisma = createPrisma();
    prisma.recipeImage.update.mockRejectedValue(new Error('database unavailable'));

    await expect(
      processImageResize(
        { recipeId: 'r1', imageId: 'i1', originalUrl },
        { storage, prisma },
      ),
    ).rejects.toThrow('database unavailable');

    expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    expect(storage.deleteFile).toHaveBeenCalledWith(
      'recipes/r1/original-thumbnail.jpg',
    );
    expect(storage.deleteFile).toHaveBeenCalledWith('recipes/r1/original-medium.jpg');
  });
});
