import { Worker, Job } from 'bullmq';
import { env } from '../../../config-middleware/config/env.js';
import { emailService } from '../../email/NodemailerEmailService.js';
import { welcomeEmailQueue, WelcomeEmailJobData } from '../queues/welcomeEmailQueue.js';

const worker = new Worker<WelcomeEmailJobData>(
  'welcome-email',
  async (job: Job<WelcomeEmailJobData>) => {
    const { email, displayName } = job.data;
    await emailService.sendWelcomeEmail(email, displayName);
    console.log(`Welcome email sent to ${email}`);
  },
  {
    connection: {
      host: new URL(env.REDIS_URL).hostname,
      port: parseInt(new URL(env.REDIS_URL).port) || 6379,
    },
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  console.log(`Welcome email job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Welcome email job ${job?.id} failed:`, err);
});

export { worker as welcomeEmailWorker };