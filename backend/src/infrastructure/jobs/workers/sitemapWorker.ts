import { Worker, Job } from 'bullmq';

import { logger } from '../../../config-middleware/config/logger.js';
import { generateSitemap } from '../SitemapService.js';
import { createQueueConnection } from '../queueConnection.js';
import { SitemapJobData } from '../queues/sitemapQueue.js';

const worker = new Worker<SitemapJobData>(
  'sitemap',
  async (job: Job<SitemapJobData>) => {
    logger.info({ trigger: job.data.trigger, jobId: job.id }, 'Sitemap generation started');
    await generateSitemap();
  },
  {
    connection: createQueueConnection(null),
    concurrency: 1,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Sitemap job completed');
});

worker.on('failed', (job, err) => {
  logger.error({
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    errorName: err.name,
  }, 'Sitemap job failed');
});

worker.on('error', error => {
  logger.error({ errorName: error.name }, 'Sitemap worker error');
});

export { worker as sitemapWorker };