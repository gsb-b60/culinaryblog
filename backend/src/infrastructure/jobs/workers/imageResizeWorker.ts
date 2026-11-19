import { PrismaClient } from '@prisma/client';
import { Job, Worker } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';
import { logger } from '../../../config-middleware/config/logger.js';
import { MinioFileStorageService } from '../../file-storage/MinioFileStorageService.js';
import { processImageResize } from '../imageResizeProcessor.js';
import { ImageResizeJobData } from '../queues/imageResizeQueue.js';

const prisma = new PrismaClient();
const storage = new MinioFileStorageService();

const worker = new Worker<ImageResizeJobData>(
  'image-resize',
  async (job: Job<ImageResizeJobData>) => {
    const { recipeId, imageId } = job.data;
    logger.debug({ recipeId, imageId, jobId: job.id }, 'Processing image resize');
    await processImageResize(job.data, { prisma, storage });
  },
  {
    prefix: env.BULLMQ_PREFIX,
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Image resize job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Image resize job failed');
});

worker.on('error', (err) => logger.error({ err }, 'Image resize worker error'));

/** Shut the worker down and release its Prisma connection. */
export const imageResizeWorker = {
  async close(): Promise<void> {
    await worker.close();
    await prisma.$disconnect();
  },
};
