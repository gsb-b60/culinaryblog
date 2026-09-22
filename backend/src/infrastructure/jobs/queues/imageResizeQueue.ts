import { Queue } from 'bullmq';
import { env } from '../../../config-middleware/config/env.js';

export const imageResizeQueue = new Queue('image-resize', {
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export interface ImageResizeJobData {
  recipeId: string;
  imageId: string;
  originalUrl: string;
}

export async function addImageResizeJob(data: ImageResizeJobData): Promise<void> {
  await imageResizeQueue.add('resize-image', data);
}