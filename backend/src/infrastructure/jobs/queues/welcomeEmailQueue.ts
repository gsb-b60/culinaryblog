import { Queue } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';

export const welcomeEmailQueue = new Queue('welcome-email', {
  connection: {
    host: new URL(env.REDIS_URL).hostname,
    port: parseInt(new URL(env.REDIS_URL).port) || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export interface WelcomeEmailJobData {
  email: string;
  displayName: string;
}

export async function addWelcomeEmailJob(data: WelcomeEmailJobData): Promise<void> {
  await welcomeEmailQueue.add('send-welcome-email', data);
}