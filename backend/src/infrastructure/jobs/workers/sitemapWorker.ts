import { Worker, Job } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';
import { SitemapJobData } from '../queues/sitemapQueue.js';

const worker = new Worker<SitemapJobData>(
  'sitemap',
  async (job: Job<SitemapJobData>) => {
    console.log(`Generating sitemap (trigger: ${job.data.trigger})`);
    
    // TODO: Implement actual sitemap generation
    // This would fetch all published recipes and generate sitemap.xml
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Sitemap generation completed');
  },
  {
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 1,
  }
);

worker.on('completed', (job) => {
  console.log(`Sitemap job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Sitemap job ${job?.id} failed:`, err);
});

export { worker as sitemapWorker };