import { PrismaClient } from '@prisma/client';
import { Job, Worker } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';
import { logger } from '../../../config-middleware/config/logger.js';
import { MinioFileStorageService } from '../../file-storage/MinioFileStorageService.js';
import { type SitemapJobData } from '../queues/sitemapQueue.js';
import { processSitemap } from '../sitemapProcessor.js';

const prisma = new PrismaClient();
const storage = new MinioFileStorageService();

/** Exposed for isolated tests and alternate worker hosts. */
export async function processSitemapJob(job: Job<SitemapJobData>): Promise<{ url: string; recipeCount: number; categoryCount: number }> {
  logger.info({ jobId: job.id, trigger: job.data.trigger }, 'Generating sitemap');
  return processSitemap(job.data.trigger, { prisma, storage });
}

const worker = new Worker<SitemapJobData>(
  'sitemap',
  processSitemapJob,
  {
    prefix: env.BULLMQ_PREFIX,
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 1,
  },
);

worker.on('completed', (job, result) => logger.info({ jobId: job.id, result }, 'Sitemap job completed'));

worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Sitemap job failed'));
worker.on('error', (err) => logger.error({ err }, 'Sitemap worker error'));

export const sitemapWorker = {
  async close(): Promise<void> {
    await worker.close();
    await prisma.$disconnect();
  },
};
