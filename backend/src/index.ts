import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { pinoHttp } from 'pino-http';

import { env } from './config-middleware/config/env.js';
import { logger } from './config-middleware/config/logger.js';
import { disconnectPrisma } from './config-middleware/shared/database/client.js';
import { initTracing } from './config-middleware/shared/tracing/index.js';
import { configureGoogleStrategy } from './infrastructure/auth/strategies/GoogleStrategy.js';
import { configureJwtStrategy } from './infrastructure/auth/strategies/JwtStrategy.js';
import { configureLocalStrategy } from './infrastructure/auth/strategies/LocalStrategy.js';
import { cacheService } from './infrastructure/cache/RedisCacheService.js';
import { scheduleSitemapJob } from './infrastructure/jobs/queues/sitemapQueue.js';
import { imageResizeWorker } from './infrastructure/jobs/workers/imageResizeWorker.js';
import { sitemapWorker } from './infrastructure/jobs/workers/sitemapWorker.js';
import { welcomeEmailWorker } from './infrastructure/jobs/workers/welcomeEmailWorker.js';
import { containerMiddleware, createContainer, destroyContainer } from './presentation/di/container.js';
import { correlationIdMiddleware } from './presentation/middleware/CorrelationIdMiddleware.js';
import { globalErrorHandler } from './presentation/middleware/GlobalErrorHandler.js';
import { generalRateLimiter } from './presentation/middleware/RateLimitMiddleware.js';
import authRoutes from './presentation/routes/authRoutes.js';
import categoryRoutes from './presentation/routes/categoryRoutes.js';
import recipeRoutes from './presentation/routes/recipeRoutes.js';

initTracing();

const app = express();

// Configure Passport
configureJwtStrategy(passport);
configureLocalStrategy(passport);
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  configureGoogleStrategy(passport);
}
app.use(passport.initialize());

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.split(',') }));
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(correlationIdMiddleware);
app.use(containerMiddleware);
app.use(generalRateLimiter);

// Health checks
app.get('/health', async (_req, res) => {
  const container = createContainer();
  const result = await container.healthCheckService.checkAll();
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(result);
});

app.get('/health/live', async (_req, res) => {
  const container = createContainer();
  const result = await container.healthCheckService.checkLiveness();
  res.json(result);
});

app.get('/health/ready', async (_req, res) => {
  const container = createContainer();
  const result = await container.healthCheckService.checkReadiness();
  const statusCode = result.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(result);
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/categories', categoryRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
    title: 'Not Found',
    status: 404,
    detail: 'Route not found',
  });
});

// Global error handler
app.use(globalErrorHandler);

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  
  // Initialize background job workers
  if (env.NODE_ENV !== 'test') {
    cacheService.connect().catch(err => logger.error({ err }, 'Failed to connect to Redis'));
    scheduleSitemapJob().catch(err => logger.error({ err }, 'Failed to schedule sitemap job'));
  }
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down...`);
  
  // Close workers
  await Promise.all([
    welcomeEmailWorker.close(),
    imageResizeWorker.close(),
    sitemapWorker.close(),
  ]);
  
  server.close(async () => {
    await destroyContainer();
    await disconnectPrisma();
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;