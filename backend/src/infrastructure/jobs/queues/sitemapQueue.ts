import { Queue } from 'bullmq';

import { createQueueConnection } from '../queueConnection.js';

export const sitemapQueue = new Queue('sitemap', {
  connection: createQueueConnection(),
  defaultJobOptions: {
    // BullMQ counts the first execution, so three attempts provide two retries.
    attempts: 3,
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
      repeat: { pattern: '0 2 * * *', tz: 'UTC' },
      jobId: 'daily-sitemap-generation',
    }
  );
}