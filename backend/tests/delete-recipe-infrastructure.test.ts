import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import express from 'express';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { DeleteRecipeCommandHandler } from '../src/application/handlers/DeleteRecipeCommandHandler.js';
import {
  GetManageableRecipesQuery,
  GetManageableRecipesQueryHandler,
} from '../src/application/handlers/ManageableRecipeQueryHandler.js';
import { env } from '../src/config-middleware/config/env.js';
import { MinioFileStorageService } from '../src/infrastructure/file-storage/MinioFileStorageService.js';
import { processFileCleanup } from '../src/infrastructure/jobs/fileCleanupProcessor.js';
import { relayFileCleanup } from '../src/infrastructure/jobs/relayFileCleanup.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

// Opt in explicitly. Only unique test fixtures and an isolated queue are touched.
const liveMinio = process.env.RUN_RECIPE_MINIO_TESTS === '1';
describe.skipIf(process.env.RUN_RECIPE_INFRA_TESTS !== '1')(
  `Delete Recipe with PostgreSQL/Redis and ${liveMinio ? 'real' : 'mocked'} MinIO`,
  () => {
    it('authenticates, verifies real cascade/outbox/BullMQ retries and processes image cleanup', async () => {
      const local = dotenv.parse(readFileSync('.env'));
      const prisma = new PrismaClient({ datasources: { db: { url: local.DATABASE_URL } } });
      // configureJwtStrategy creates its own client from process.env.
      process.env.DATABASE_URL = local.DATABASE_URL;
      const { configureJwtStrategy } =
        await import('../src/infrastructure/auth/strategies/JwtStrategy.js');
      const suffix = randomUUID();
      const ownerId = randomUUID();
      const otherId = randomUUID();
      const adminId = randomUUID();
      const categoryId = randomUUID();
      const recipeId = randomUUID();
      const realStorage = new MinioFileStorageService();
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const storage = liveMinio
        ? realStorage
        : {
            getFileUrl: (key: string) => realStorage.getFileUrl(key),
            uploadFile: async (key: string) => realStorage.getFileUrl(key),
            deleteFile: mockDelete,
            generatePresignedUrl: async (key: string) => realStorage.getFileUrl(key),
          };
      const keys = ['original', 'medium', 'thumbnail', 'step'].map(
        (name) => `recipes/${recipeId}/${name}.png`,
      );
      const connection = new Redis(local.REDIS_URL ?? env.REDIS_URL, {
        maxRetriesPerRequest: null,
      });
      const queue = new Queue(`file-cleanup-test-${suffix}`, { connection });
      const s3 = new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        forcePathStyle: true,
        credentials: { accessKeyId: env.S3_ACCESS_KEY!, secretAccessKey: env.S3_SECRET_KEY! },
      });
      let worker: Worker | undefined;
      try {
        await connection.ping();
        for (const [id, role] of [
          [ownerId, 'AUTHOR'],
          [otherId, 'AUTHOR'],
          [adminId, 'ADMIN'],
        ] as const) {
          await prisma.user.create({
            data: { id, email: `${id}@delete-test.example`, displayName: 'Delete test', role },
          });
        }
        await prisma.category.create({
          data: { id: categoryId, name: `Delete test ${suffix}`, slug: `delete-test-${suffix}` },
        });
        const urls = [];
        for (const key of keys)
          urls.push(
            liveMinio
              ? await realStorage.uploadFile(key, Buffer.from('test image'), 'image/png')
              : storage.getFileUrl(key),
          );
        await prisma.recipe.create({
          data: {
            id: recipeId,
            title: 'Delete test recipe',
            slug: `delete-test-${suffix}`,
            description: 'Temporary integration fixture',
            prepTime: 1,
            cookTime: 1,
            servings: 1,
            authorId: ownerId,
            categoryId,
            nutritionCalories: 20,
            ingredients: { create: [{ name: 'Test ingredient', isDeleted: true }] },
            steps: {
              create: [
                { stepNumber: 1, title: 'Test step', description: 'Test', imageUrl: urls[3] },
              ],
            },
            images: {
              create: [
                {
                  originalUrl: urls[0]!,
                  mediumUrl: urls[1],
                  thumbnailUrl: urls[2],
                  isDeleted: true,
                },
              ],
            },
          },
        });
        commandBus.registerCommandHandler(
          'DeleteRecipeCommand',
          new DeleteRecipeCommandHandler(prisma, async () => {}),
        );
        commandBus.registerQueryHandler(
          GetManageableRecipesQuery.name,
          new GetManageableRecipesQueryHandler(prisma),
        );
        configureJwtStrategy(passport);
        const app = express();
        app.use(passport.initialize());
        app.use('/api/v1/recipes', recipeRoutes);
        app.use(globalErrorHandler);
        const token = (userId: string) =>
          jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '5m' });
        expect((await request(app).delete(`/api/v1/recipes/${recipeId}`)).status).toBe(401);
        expect(
          (
            await request(app)
              .delete(`/api/v1/recipes/${recipeId}`)
              .auth(token(otherId), { type: 'bearer' })
          ).status,
        ).toBe(403);
        expect(
          (
            await request(app)
              .get('/api/v1/recipes/manageable?page=1&pageSize=50')
              .auth(token(otherId), { type: 'bearer' })
          ).body.items,
        ).toEqual([]);
        const ownerList = await request(app)
          .get('/api/v1/recipes/manageable?page=1&pageSize=50')
          .auth(token(ownerId), { type: 'bearer' });
        expect(ownerList.status).toBe(200);
        expect(ownerList.body.items.some((item: { id: string }) => item.id === recipeId)).toBe(
          true,
        );
        const response = await request(app)
          .delete(`/api/v1/recipes/${recipeId}`)
          .auth(token(ownerId), { type: 'bearer' });
        expect(response.status).toBe(204);
        expect(response.text).toBe('');
        expect(await prisma.recipe.findUnique({ where: { id: recipeId } })).toBeNull();
        expect(await prisma.recipeIngredient.count({ where: { recipeId } })).toBe(0);
        expect(await prisma.recipeStep.count({ where: { recipeId } })).toBe(0);
        expect(await prisma.recipeImage.count({ where: { recipeId } })).toBe(0);
        expect(await prisma.user.count({ where: { id: ownerId } })).toBe(1);
        expect(await prisma.category.count({ where: { id: categoryId } })).toBe(1);
        expect(await prisma.fileCleanupTask.count({ where: { recipeId } })).toBe(4);
        expect(
          (
            await request(app)
              .delete(`/api/v1/recipes/${recipeId}`)
              .auth(token(adminId), { type: 'bearer' })
          ).status,
        ).toBe(404);
        // Isolate relay from any real pending cleanup requests.
        const scoped = {
          fileCleanupTask: {
            findMany: () => prisma.fileCleanupTask.findMany({ where: { recipeId } }),
            deleteMany: (args: Parameters<typeof prisma.fileCleanupTask.deleteMany>[0]) =>
              prisma.fileCleanupTask.deleteMany(args),
          },
        };
        await expect(
          relayFileCleanup(scoped as never, async () => {
            throw new Error('Simulated Redis outage');
          }),
        ).rejects.toThrow('Simulated Redis outage');
        expect(await prisma.fileCleanupTask.count({ where: { recipeId } })).toBe(4);
        await relayFileCleanup(scoped as never, (id, data) =>
          queue.add('delete', data, {
            jobId: id,
            attempts: 4,
            backoff: { type: 'exponential', delay: 100 },
          }),
        );
        expect(await prisma.fileCleanupTask.count({ where: { recipeId } })).toBe(0);
        let simulatedFailures = 0;
        worker = new Worker(
          queue.name,
          async (job) => {
            if (job.data.url === urls[0] && simulatedFailures < 3) {
              simulatedFailures += 1;
              throw new Error('Simulated transient MinIO failure');
            }
            await processFileCleanup(job.data, storage);
          },
          { connection },
        );
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline && (await queue.getCompletedCount()) < 4) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        expect(await queue.getCompletedCount()).toBe(4);
        expect(simulatedFailures).toBe(3);
        if (liveMinio) {
          for (const key of keys) {
            await expect(
              s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key })),
            ).rejects.toMatchObject({ $metadata: { httpStatusCode: 404 } });
          }
        } else {
          expect(mockDelete).toHaveBeenCalledTimes(4);
          for (const key of keys) expect(mockDelete).toHaveBeenCalledWith(key);
        }
      } finally {
        await worker?.close();
        await queue.obliterate({ force: true });
        await queue.close();
        await connection.quit();
        await prisma.recipe.deleteMany({ where: { id: recipeId } });
        await prisma.fileCleanupTask.deleteMany({ where: { recipeId } });
        await prisma.category.deleteMany({ where: { id: categoryId } });
        await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId, adminId] } } });
        if (liveMinio)
          for (const key of keys) await realStorage.deleteFile(key).catch(() => undefined);
        s3.destroy();
        await prisma.$disconnect();
      }
    }, 30000);
  },
);
