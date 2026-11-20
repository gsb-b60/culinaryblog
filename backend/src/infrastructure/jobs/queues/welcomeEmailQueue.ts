import { Queue } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';

export const welcomeEmailQueue = new Queue('welcome-email', {
  prefix: env.BULLMQ_PREFIX,
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  },
  defaultJobOptions: {
    // BullMQ's attempts value includes the initial delivery attempt.
    // The contract requires three retries after that initial attempt.
    attempts: 4,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export interface WelcomeEmailJobData {
  userId: string;
  email: string;
}

/** Enqueue welcome email delivery in the configured BullMQ namespace. */
export async function addWelcomeEmailJob(data: WelcomeEmailJobData): Promise<void> {
  await welcomeEmailQueue.add('send-welcome-email', data);
}
