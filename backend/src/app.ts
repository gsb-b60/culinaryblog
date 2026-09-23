import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { createAuthRouter } from './api/routes/auth.routes.js';
import type { CommandBus } from './application/shared/commandBus.js';
import { env } from './config-middleware/config/env.js';
import { logger } from './config-middleware/config/logger.js';
import { errorHandler } from './config-middleware/middleware/errorHandler.js';
import { notFoundHandler } from './config-middleware/middleware/notFoundHandler.js';
import { prisma } from './config-middleware/shared/database/client.js';

export function createApp(bus: CommandBus): Express {
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

  app.use('/api/v1/auth', createAuthRouter(bus));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
