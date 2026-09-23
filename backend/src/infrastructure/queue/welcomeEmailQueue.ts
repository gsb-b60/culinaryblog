import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import type { WelcomeEmailJob } from '../../application/commands/auth/RegisterCommandHandler.js';
import { env } from '../../config-middleware/config/env.js';
import { logger } from '../../config-middleware/config/logger.js';

const QUEUE_NAME = 'welcome-email';

let queue: Queue<WelcomeEmailJob> | undefined;

function getQueue(): Queue<WelcomeEmailJob> {
  if (!queue) {
    const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    queue = new Queue<WelcomeEmailJob>(QUEUE_NAME, { connection });
  }
  return queue;
}

export function enqueueWelcomeEmail(job: WelcomeEmailJob): void {
  try {
    void getQueue()
      .add('welcome', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'Failed to enqueue welcome email job');
      });
  } catch (err) {
    logger.error({ err }, 'Failed to create welcome email queue');
  }
}

export async function closeWelcomeEmailQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = undefined;
  }
}
