import { describe, expect, it, vi } from 'vitest';

import { processFileCleanup, getRecipeFileKey } from '../src/infrastructure/jobs/fileCleanupProcessor.js';
import { relayFileCleanup } from '../src/infrastructure/jobs/relayFileCleanup.js';

describe('file cleanup processor', () => {
  it('deletes only files belonging to the deleted recipe', async () => {
    const storage = {
      getFileUrl: vi.fn(() => 'http://minio:9000/recipes-bucket/'),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };

    await processFileCleanup(
      { recipeId: 'r1', url: 'http://minio:9000/recipes-bucket/recipes/r1/image.jpg' },
      storage,
    );

    expect(storage.deleteFile).toHaveBeenCalledWith('recipes/r1/image.jpg');
    expect(getRecipeFileKey(
      'http://minio:9000/recipes-bucket/recipes/r2/image.jpg',
      'r1',
      'http://minio:9000/recipes-bucket/',
    )).toBeNull();
  });

  it('does not delete a URL outside the configured object store', async () => {
    const storage = {
      getFileUrl: vi.fn(() => 'http://minio:9000/recipes-bucket/'),
      deleteFile: vi.fn(),
    };

    await processFileCleanup({ recipeId: 'r1', url: 'https://example.com/image.jpg' }, storage);

    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it('propagates storage failures so BullMQ can retry the job', async () => {
    const storage = {
      getFileUrl: vi.fn(() => 'http://minio:9000/recipes-bucket/'),
      deleteFile: vi.fn().mockRejectedValue(new Error('MinIO unavailable')),
    };

    await expect(
      processFileCleanup(
        { recipeId: 'r1', url: 'http://minio:9000/recipes-bucket/recipes/r1/image.jpg' },
        storage,
      ),
    ).rejects.toThrow('MinIO unavailable');
  });
});

describe('file cleanup outbox relay', () => {
  it('enqueues a task using a stable job ID before removing it from the outbox', async () => {
    const task = { id: 'task-1', recipeId: 'r1', url: 'http://minio/image.jpg' };
    const prisma = {
      fileCleanupTask: {
        findMany: vi.fn().mockResolvedValue([task]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const enqueue = vi.fn().mockResolvedValue({});

    await relayFileCleanup(prisma as never, enqueue);

    expect(enqueue).toHaveBeenCalledWith('task-1', { recipeId: 'r1', url: task.url });
    expect(prisma.fileCleanupTask.deleteMany).toHaveBeenCalledWith({ where: { id: 'task-1' } });
  });

  it('keeps the task in the outbox when enqueue fails', async () => {
    const prisma = {
      fileCleanupTask: {
        findMany: vi.fn().mockResolvedValue([{ id: 'task-1', recipeId: 'r1', url: 'url' }]),
        deleteMany: vi.fn(),
      },
    };

    await expect(
      relayFileCleanup(prisma as never, vi.fn().mockRejectedValue(new Error('Redis unavailable'))),
    ).rejects.toThrow('Redis unavailable');
    expect(prisma.fileCleanupTask.deleteMany).not.toHaveBeenCalled();
  });
});
