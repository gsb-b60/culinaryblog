import { describe, expect, it, vi } from 'vitest';

import { MinioFileStorageService } from '../src/infrastructure/file-storage/MinioFileStorageService.js';
import {
  getRecipeFileKey,
  processFileCleanup,
} from '../src/infrastructure/jobs/fileCleanupProcessor.js';
import { relayFileCleanup } from '../src/infrastructure/jobs/relayFileCleanup.js';

const base = 'http://localhost:9000/culinary/';
describe('File cleanup processor', () => {
  it('extracts the object key from a MinIO URL and drops query parameters', () => {
    expect(getRecipeFileKey(base + 'recipes/r/photo%20one.jpg?token=abc', 'r', base)).toBe(
      'recipes/r/photo one.jpg',
    );
  });
  it.each([
    'https://external.example/recipes/r/photo.jpg',
    base + 'recipes/other/photo.jpg',
    'http://localhost:9000/other/recipes/r/photo.jpg',
    base + 'recipes/r/%2e%2e%2fother.jpg',
    base + 'recipes/r/%5cother.jpg',
  ])('does not delete external, shared or unsafe URLs: %s', (url) => {
    expect(getRecipeFileKey(url, 'r', base)).toBeNull();
  });
  it('lets storage failures escape so BullMQ can retry', async () => {
    const storage = {
      getFileUrl: () => base,
      deleteFile: vi.fn().mockRejectedValue(new Error('MinIO offline')),
    };
    await expect(
      processFileCleanup({ url: base + 'recipes/r/a.jpg', recipeId: 'r' }, storage as never),
    ).rejects.toThrow('MinIO offline');
  });
  it('skips external files', async () => {
    const storage = { getFileUrl: () => base, deleteFile: vi.fn() };
    await processFileCleanup(
      { url: 'https://example.com/image.jpg', recipeId: 'r' },
      storage as never,
    );
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });
  it('MinIO service propagates an S3 deletion error instead of swallowing it', async () => {
    const storage = new MinioFileStorageService();
    Object.assign(storage, { client: { send: vi.fn().mockRejectedValue(new Error('S3 denied')) } });
    await expect(storage.deleteFile('recipes/r/a.jpg')).rejects.toThrow('S3 denied');
  });
});
describe('Durable cleanup relay', () => {
  function setup() {
    const fileCleanupTask = {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 'task-1', recipeId: 'r', url: base + 'recipes/r/a.jpg' }]),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    return { prisma: { fileCleanupTask }, fileCleanupTask, enqueue: vi.fn().mockResolvedValue({}) };
  }
  it('removes the durable task only after queue acknowledgement', async () => {
    const { prisma, fileCleanupTask, enqueue } = setup();
    await relayFileCleanup(prisma as never, enqueue);
    expect(enqueue).toHaveBeenCalledWith('task-1', {
      recipeId: 'r',
      url: base + 'recipes/r/a.jpg',
    });
    expect(enqueue.mock.invocationCallOrder[0]).toBeLessThan(
      fileCleanupTask.deleteMany.mock.invocationCallOrder[0]!,
    );
  });
  it('retains the task when Redis fails', async () => {
    const { prisma, fileCleanupTask, enqueue } = setup();
    enqueue.mockRejectedValue(new Error('Redis offline'));
    await expect(relayFileCleanup(prisma as never, enqueue)).rejects.toThrow('Redis offline');
    expect(fileCleanupTask.deleteMany).not.toHaveBeenCalled();
  });
});
