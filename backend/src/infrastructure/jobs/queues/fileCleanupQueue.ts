import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { env } from '../../../config-middleware/config/env.js';

export interface FileCleanupJobData {
  recipeId: string;
  url: string;
}

export const fileCleanupConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
export const fileCleanupQueue = new Queue<FileCleanupJobData>('file-cleanup', {
  connection: fileCleanupConnection,
  defaultJobOptions: {
    // One initial attempt + three retries.
    attempts: 4,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60 },
    removeOnFail: false,
  },
});
