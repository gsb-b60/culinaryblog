import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/presentation/middleware/AuthMiddleware.js', () => ({
  authenticateJwt: (req: any, res: any, next: any) => {
    const identity = req.headers.authorization;
    if (!identity) {
      res.sendStatus(401);
      return;
    }
    req.user = { id: identity, roles: identity === 'admin' ? ['ADMIN'] : ['AUTHOR'] };
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  authorizeOwnerOrAdmin: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../src/presentation/middleware/RateLimitMiddleware.js', () => ({
  uploadRateLimiter: (_req: any, _res: any, next: any) => next(),
  generalRateLimiter: (_req: any, _res: any, next: any) => next(),
  authRateLimiter: (_req: any, _res: any, next: any) => next(),
  passwordResetRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../src/presentation/di/container.js', () => ({ getContainer: vi.fn() }));

import { getContainer } from '../src/presentation/di/container.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

const prisma = {
  recipe: { findFirst: vi.fn() },
  recipeImage: {
    count: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  fileCleanupTask: { createMany: vi.fn() },
  $transaction: vi.fn(async (run: (tx: typeof prisma) => unknown) => run(prisma)),
};

const fileStorageService = {
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getFileUrl: vi.fn(),
};

const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);

// 1x1 transparent PNG: real magic bytes so file-type detects image/png.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const uploadedUrl = 'http://localhost:9000/lethimcook/recipes/r1/image.png';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getContainer).mockReturnValue({ prisma, fileStorageService } as never);

  prisma.$transaction.mockImplementation(async (run: (tx: typeof prisma) => unknown) => run(prisma));
  prisma.recipe.findFirst.mockResolvedValue({ authorId: 'owner' });
  prisma.recipeImage.count.mockResolvedValue(0);
  prisma.recipeImage.aggregate.mockResolvedValue({ _max: { orderIndex: null } });
  prisma.recipeImage.updateMany.mockResolvedValue({ count: 1 });
  prisma.recipeImage.delete.mockResolvedValue({});
  prisma.fileCleanupTask.createMany.mockResolvedValue({ count: 1 });
  fileStorageService.uploadFile.mockResolvedValue(uploadedUrl);
  fileStorageService.deleteFile.mockResolvedValue(undefined);
});

describe('POST /api/v1/recipes/:id/images', () => {
  it('persists the first uploaded image as primary', async () => {
    prisma.recipeImage.create.mockResolvedValue({
      id: 'i1',
      originalUrl: uploadedUrl,
      altText: 'Phở bò',
      isPrimary: true,
    });

    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner')
      .field('altText', 'Phở bò')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      imageId: 'i1',
      originalUrl: uploadedUrl,
      altText: 'Phở bò',
      isPrimary: true,
    });
    expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
      expect.stringMatching(/^recipes\/r1\/.+\.png$/),
      png,
      'image/png',
    );
    expect(prisma.recipeImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipeId: 'r1',
        originalUrl: uploadedUrl,
        altText: 'Phở bò',
        isPrimary: true,
        orderIndex: 0,
      }),
    });
  });

  it('does not make a later image primary', async () => {
    prisma.recipeImage.count.mockResolvedValue(2);
    prisma.recipeImage.aggregate.mockResolvedValue({ _max: { orderIndex: 1 } });
    prisma.recipeImage.create.mockResolvedValue({
      id: 'i3',
      originalUrl: uploadedUrl,
      altText: null,
      isPrimary: false,
    });

    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(prisma.recipeImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isPrimary: false, orderIndex: 2 }),
    });
  });

  it('removes the uploaded object when the database write fails', async () => {
    prisma.recipeImage.create.mockRejectedValue(new Error('db down'));

    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(500);
    expect(fileStorageService.deleteFile).toHaveBeenCalledWith(
      expect.stringMatching(/^recipes\/r1\/.+\.png$/),
    );
  });

  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(401);
    expect(fileStorageService.uploadFile).not.toHaveBeenCalled();
  });

  it('returns 403 for another author', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ authorId: 'someone-else' });

    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(403);
    expect(fileStorageService.uploadFile).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing recipe', async () => {
    prisma.recipe.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/recipes/missing/images')
      .set('Authorization', 'admin')
      .attach('file', png, { filename: 'pho.png', contentType: 'image/png' });

    expect(response.status).toBe(404);
  });

  it('rejects a file whose magic bytes are not an image', async () => {
    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner')
      .attach('file', Buffer.from('not an image'), {
        filename: 'fake.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('FILE_MIME_INVALID');
    expect(fileStorageService.uploadFile).not.toHaveBeenCalled();
  });

  it('requires a file field', async () => {
    const response = await request(app)
      .post('/api/v1/recipes/r1/images')
      .set('Authorization', 'owner');

    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/v1/recipes/:id/images/:imageId/primary', () => {
  it('clears the old primary before setting the new one', async () => {
    prisma.recipeImage.findFirst.mockResolvedValue({
      id: 'i2',
      recipeId: 'r1',
      isDeleted: false,
      isPrimary: false,
    });
    prisma.recipeImage.update.mockResolvedValue({
      id: 'i2',
      originalUrl: uploadedUrl,
      mediumUrl: null,
      thumbnailUrl: null,
      altText: null,
      isPrimary: true,
      orderIndex: 1,
    });

    const response = await request(app)
      .patch('/api/v1/recipes/r1/images/i2/primary')
      .set('Authorization', 'owner');

    expect(response.status).toBe(200);
    expect(response.body.isPrimary).toBe(true);
    expect(prisma.recipeImage.updateMany).toHaveBeenCalledWith({
      where: { recipeId: 'r1', isPrimary: true },
      data: { isPrimary: false },
    });
    expect(prisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 'i2' },
      data: { isPrimary: true },
    });
  });

  it('returns 404 when the image is not on the recipe', async () => {
    prisma.recipeImage.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .patch('/api/v1/recipes/r1/images/missing/primary')
      .set('Authorization', 'owner');

    expect(response.status).toBe(404);
    expect(prisma.recipeImage.update).not.toHaveBeenCalled();
  });

  it('returns 403 for another author', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ authorId: 'someone-else' });

    const response = await request(app)
      .patch('/api/v1/recipes/r1/images/i2/primary')
      .set('Authorization', 'owner');

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/v1/recipes/:id/images/:imageId', () => {
  it('queues MinIO cleanup and promotes the next image when the primary is deleted', async () => {
    prisma.recipeImage.findFirst
      .mockResolvedValueOnce({
        id: 'i1',
        recipeId: 'r1',
        isDeleted: false,
        isPrimary: true,
        originalUrl: 'http://localhost:9000/lethimcook/recipes/r1/original.png',
        mediumUrl: 'http://localhost:9000/lethimcook/recipes/r1/medium.png',
        thumbnailUrl: null,
      })
      .mockResolvedValueOnce({ id: 'i2' });

    const response = await request(app)
      .delete('/api/v1/recipes/r1/images/i1')
      .set('Authorization', 'owner');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(prisma.fileCleanupTask.createMany).toHaveBeenCalledWith({
      data: [
        { recipeId: 'r1', url: 'http://localhost:9000/lethimcook/recipes/r1/original.png' },
        { recipeId: 'r1', url: 'http://localhost:9000/lethimcook/recipes/r1/medium.png' },
      ],
    });
    expect(prisma.recipeImage.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    expect(prisma.recipeImage.update).toHaveBeenCalledWith({
      where: { id: 'i2' },
      data: { isPrimary: true },
    });
  });

  it('does not promote anything when deleting a secondary image', async () => {
    prisma.recipeImage.findFirst.mockResolvedValue({
      id: 'i2',
      recipeId: 'r1',
      isDeleted: false,
      isPrimary: false,
      originalUrl: uploadedUrl,
      mediumUrl: null,
      thumbnailUrl: null,
    });

    const response = await request(app)
      .delete('/api/v1/recipes/r1/images/i2')
      .set('Authorization', 'owner');

    expect(response.status).toBe(204);
    expect(prisma.recipeImage.delete).toHaveBeenCalledOnce();
    expect(prisma.recipeImage.update).not.toHaveBeenCalled();
  });

  it('accepts an admin deleting another author image', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ authorId: 'someone-else' });
    prisma.recipeImage.findFirst.mockResolvedValue({
      id: 'i2',
      recipeId: 'r1',
      isDeleted: false,
      isPrimary: false,
      originalUrl: uploadedUrl,
      mediumUrl: null,
      thumbnailUrl: null,
    });

    const response = await request(app)
      .delete('/api/v1/recipes/r1/images/i2')
      .set('Authorization', 'admin');

    expect(response.status).toBe(204);
  });

  it('returns 403 for another author', async () => {
    prisma.recipe.findFirst.mockResolvedValue({ authorId: 'someone-else' });

    const response = await request(app)
      .delete('/api/v1/recipes/r1/images/i2')
      .set('Authorization', 'owner');

    expect(response.status).toBe(403);
    expect(prisma.recipeImage.delete).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing image', async () => {
    prisma.recipeImage.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/v1/recipes/r1/images/missing')
      .set('Authorization', 'owner');

    expect(response.status).toBe(404);
  });

  it('returns 404 for a missing recipe', async () => {
    prisma.recipe.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/v1/recipes/missing/images/i1')
      .set('Authorization', 'owner');

    expect(response.status).toBe(404);
  });
});
