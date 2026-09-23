import { Queue } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';

export const sitemapQueue = new Queue('sitemap', {
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  },
});

export interface SitemapJobData {
  trigger: 'manual' | 'scheduled';
}

export async function addSitemapJob(data: SitemapJobData = { trigger: 'manual' }): Promise<void> {
  await sitemapQueue.add('generate-sitemap', data);
}

// Recurring job - runs daily at 2 AM UTC
export async function scheduleSitemapJob(): Promise<void> {
  await sitemapQueue.add(
    'generate-sitemap',
    { trigger: 'scheduled' },
    {
      repeat: { pattern: '0 2 * * *' }, // Cron: daily at 2 AM
      jobId: 'daily-sitemap-generation',
    }
  );
}