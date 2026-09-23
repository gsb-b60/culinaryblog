import { createApp } from './app.js';
import { env } from './config-middleware/config/env.js';
import { logger } from './config-middleware/config/logger.js';
import { disconnectPrisma } from './config-middleware/shared/database/client.js';
import { initTracing } from './config-middleware/shared/tracing/index.js';
import { createCommandBus } from './container.js';
import { closeWelcomeEmailQueue } from './infrastructure/queue/welcomeEmailQueue.js';

initTracing();

const app = createApp(createCommandBus());

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down...`);
  server.close(async () => {
    await closeWelcomeEmailQueue();
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
