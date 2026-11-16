import { Queue } from 'bullmq';

import { createQueueConnection } from '../queueConnection.js';

export const welcomeEmailQueue = new Queue('welcome-email', {
  connection: createQueueConnection(),
  defaultJobOptions: {
    // The acceptance criteria require three total attempts.
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
  userId: string;
  email: string;
}

export async function addWelcomeEmailJob(data: WelcomeEmailJobData): Promise<void> {
  await welcomeEmailQueue.add('send-welcome-email', data);
}