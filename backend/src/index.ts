import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import NodeCache from 'node-cache';

import { env } from './config-middleware/config/env.js';
import { logger } from './config-middleware/config/logger.js';
import { prisma, disconnectPrisma } from './config-middleware/shared/database/client.js';
import { errorHandler } from './config-middleware/middleware/errorHandler.js';
import { notFoundHandler } from './config-middleware/middleware/notFoundHandler.js';
import { initTracing } from './config-middleware/shared/tracing/index.js';
import { commandBus } from './application/command-bus.js';
import { GetCategoriesQueryHandler } from './application/queries/categories/GetCategoriesQueryHandler.js';
import { GetCategoryBySlugQueryHandler } from './application/queries/categories/GetCategoryBySlugQueryHandler.js';
import { categoryListRoutes } from './presentation/routes/categoryRoutes.js';

initTracing();

commandBus.registerQueryHandler(
  'GetCategoriesQuery',
  new GetCategoriesQueryHandler(prisma, new NodeCache())
);
commandBus.registerQueryHandler(
  'GetCategoryBySlugQuery',
  new GetCategoryBySlugQueryHandler(prisma)
);

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(',') }));
app.use(express.json());
// @ts-expect-error pino-http types incompatible with ESM
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/live', (_req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

app.use('/api/v1/categories', categoryListRoutes);

app.use(errorHandler);
app.use(notFoundHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
