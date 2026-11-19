import { Queue } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';

export interface ImageResizeJobData {
  recipeId: string;
  imageId: string;
  originalUrl: string;
}

/** Initial attempt plus three retries, matching FR-JOB-002. */
export const imageResizeJobOptions = {
  attempts: 4,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};

let queue: Queue<ImageResizeJobData> | undefined;

/**
 * Create the queue on first use so importing the route does not open a Redis
 * connection during unit tests or health checks.
 */
export function getImageResizeQueue(): Queue<ImageResizeJobData> {
  if (!queue) {
    queue = new Queue<ImageResizeJobData>('image-resize', {
      prefix: env.BULLMQ_PREFIX,
      connection: {
        host: new URL(env.REDIS_URL).hostname,
        port: parseInt(new URL(env.REDIS_URL).port) || 6379,
      },
      defaultJobOptions: imageResizeJobOptions,
    });
  }
  return queue;
}

/** Enqueue image processing in the configured BullMQ namespace. */
export async function addImageResizeJob(data: ImageResizeJobData): Promise<void> {
  await getImageResizeQueue().add('resize-image', data);
}

/** Close the lazily created queue during shutdown. */
export async function closeImageResizeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
