import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/config-middleware/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    S3_ENDPOINT: 'http://minio:9000',
    S3_BUCKET: 'recipes-bucket',
    S3_ACCESS_KEY: 'fixture',
    S3_SECRET_KEY: 'fixture',
    S3_REGION: 'us-east-1',
  },
}));

import { MinioFileStorageService } from '../src/infrastructure/file-storage/MinioFileStorageService.js';
import {
  getRecipeFileKey,
  processFileCleanup,
} from '../src/infrastructure/jobs/fileCleanupProcessor.js';

describe('storage URL and recipe cleanup round trip', () => {
  it.each([
    'normal.png',
    '100%fresh.png',
    'meal..png',
    'literal%20name.png',
    'meal#1.png',
    'meal?part.png',
    'space name.png',
    'tiếng Việt.png',
    'plus+eq=.png',
  ])('deletes the exact object key for %s', async (name) => {
    const storage = new MinioFileStorageService();
    const remove = vi.spyOn(storage, 'deleteFile').mockResolvedValue(undefined);
    const key = 'recipes/r1/' + name;
    const url = storage.getFileUrl(key);
    expect(getRecipeFileKey(url, 'r1', storage.getFileUrl(''))).toBe(key);
    await processFileCleanup({ recipeId: 'r1', url }, storage);
    expect(remove).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith(key);
  });

  it('keeps a percent sequence distinct from an actual space', () => {
    const storage = new MinioFileStorageService();
    expect(storage.getFileUrl('recipes/r1/literal%20name.png')).not.toBe(
      storage.getFileUrl('recipes/r1/literal name.png'),
    );
  });

  it.each([
    'http://minio:9000/recipes-bucket/recipes/r2/image.png',
    'http://minio:9000/recipes-bucket/recipes/r1/../r2/image.png',
    'http://minio:9000/recipes-bucket/recipes/r1/%2e%2e/r2/image.png',
    'http://minio:9000/recipes-bucket/recipes/r1/image%2F..%2Fr2.png',
    'http://other:9000/recipes-bucket/recipes/r1/image.png',
  ])('still refuses another recipe or traversal URL: %s', (url) => {
    expect(getRecipeFileKey(url, 'r1', 'http://minio:9000/recipes-bucket/')).toBeNull();
  });
});
