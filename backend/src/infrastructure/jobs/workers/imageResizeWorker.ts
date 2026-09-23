import { Worker, Job } from 'bullmq';
import { env } from '../../../config-middleware/config/env.js';
import { imageResizeQueue, ImageResizeJobData } from '../queues/imageResizeQueue.js';

const worker = new Worker<ImageResizeJobData>(
  'image-resize',
  async (job: Job<ImageResizeJobData>) => {
    const { recipeId, imageId, originalUrl } = job.data;
    console.log(`Processing image resize for recipe ${recipeId}, image ${imageId}`);
    
    // TODO: Implement actual image processing with sharp
    // For now, just simulate the work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Image resize completed for ${imageId}`);
  },
  {
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 3,
  }
);

worker.on('completed', (job) => {
  console.log(`Image resize job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Image resize job ${job?.id} failed:`, err);
});

export { worker as imageResizeWorker };