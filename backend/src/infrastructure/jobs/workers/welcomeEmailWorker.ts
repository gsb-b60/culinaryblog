import { Worker, Job } from 'bullmq';

import { logger } from '../../../config-middleware/config/logger.js';
import { prisma } from '../../../config-middleware/shared/database/client.js';
import { emailService } from '../../email/NodemailerEmailService.js';
import { createQueueConnection } from '../queueConnection.js';
import { WelcomeEmailJobData } from '../queues/welcomeEmailQueue.js';

const worker = new Worker<WelcomeEmailJobData>(
  'welcome-email',
  async (job: Job<WelcomeEmailJobData>) => {
    const user = await prisma.user.findUnique({
      where: { id: job.data.userId },
      select: { displayName: true },
    });
    if (!user) throw new Error('Registered user was not found for welcome email');

    await emailService.sendWelcomeEmail(job.data.email, user.displayName);
    logger.info({ jobId: job.id, userId: job.data.userId }, 'Welcome email sent');
  },
  {
    connection: createQueueConnection(null),
    concurrency: 5,
  },
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Welcome email job completed');
});

worker.on('failed', (job, err) => {
  logger.error({
    jobId: job?.id,
    userId: job?.data.userId,
    attemptsMade: job?.attemptsMade,
    errorName: err.name,
  }, 'Welcome email job failed');
});

worker.on('error', error => {
  logger.error({ errorName: error.name }, 'Welcome email worker error');
});

export { worker as welcomeEmailWorker };