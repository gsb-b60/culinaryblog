import { PrismaClient } from '@prisma/client';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { env } from '../../../config-middleware/config/env.js';
import { logger } from '../../../config-middleware/config/logger.js';
import { MinioFileStorageService } from '../../file-storage/MinioFileStorageService.js';
import { processFileCleanup } from '../fileCleanupProcessor.js';
import {
  type FileCleanupJobData,
  fileCleanupConnection,
  fileCleanupQueue,
} from '../queues/fileCleanupQueue.js';
import { relayFileCleanup } from '../relayFileCleanup.js';

export function startFileCleanupWorker(): { close: () => Promise<void> } {
  const prisma = new PrismaClient();
  const storage = new MinioFileStorageService();
  const workerConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker<FileCleanupJobData>(
    'file-cleanup',
    (job) => processFileCleanup(job.data, storage),
    {
      prefix: env.BULLMQ_PREFIX,
      connection: workerConnection,
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'File cleanup job failed'),
  );
  worker.on('error', (err) => logger.error({ err }, 'File cleanup worker error'));
  fileCleanupConnection.on('error', (err) =>
    logger.error({ err }, 'File cleanup queue Redis error'),
  );
  workerConnection.on('error', (err) =>
    logger.error({ err }, 'File cleanup worker Redis error'),
  );

  let pending: Promise<void> | undefined;
  let stopping = false;
  const flush = (): void => {
    if (pending || stopping) return;
    pending = relayFileCleanup(prisma, (id, data) =>
      fileCleanupQueue.add('delete', data, { jobId: id }),
    )
      .catch((err) => logger.error({ err }, 'Cleanup tasks retained for next relay'))
      .finally(() => {
        pending = undefined;
      });
  };
  flush();
  const timer = setInterval(flush, 5000);
  timer.unref();

  return {
    async close(): Promise<void> {
      stopping = true;
      clearInterval(timer);
      await pending;
      await worker.close();
      await fileCleanupQueue.close();
      await Promise.all([workerConnection.quit(), fileCleanupConnection.quit(), prisma.$disconnect()]);
    },
  };
}
