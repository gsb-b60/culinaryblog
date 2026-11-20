import { PrismaClient } from '@prisma/client';
import { Job, Worker } from 'bullmq';

import { env } from '../../../config-middleware/config/env.js';
import { logger } from '../../../config-middleware/config/logger.js';
import { emailService } from '../../email/NodemailerEmailService.js';
import { WelcomeEmailJobData } from '../queues/welcomeEmailQueue.js';

const prisma = new PrismaClient();

export async function processWelcomeEmailJob(job: Job<WelcomeEmailJobData>): Promise<void> {
  const { userId, email } = job.data;
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
    select: { displayName: true },
  });
  if (!user) {
    throw new Error(`Cannot send welcome email: user ${userId} was not found`);
  }

  await emailService.sendWelcomeEmail(email, user.displayName);
  logger.info({ email, userId, jobId: job.id }, 'Welcome email sent');
}

const worker = new Worker<WelcomeEmailJobData>(
  'welcome-email',
  processWelcomeEmailJob,
  {
    prefix: env.BULLMQ_PREFIX,
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Welcome email job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Welcome email job failed');
});

worker.on('error', (err) => {
  logger.error({ err }, 'Welcome email worker error');
});

export const welcomeEmailWorker = {
  async close(): Promise<void> {
    await worker.close();
    await prisma.$disconnect();
  },
};
