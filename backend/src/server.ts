import { IncomingMessage } from 'node:http';
import { resolve } from 'node:path';

import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { pinoHttp } from 'pino-http';

import { env } from './config-middleware/config/env.js';
import { logger } from './config-middleware/config/logger.js';
import { disconnectPrisma } from './config-middleware/shared/database/client.js';
import { shutdownTracing } from './config-middleware/shared/tracing/index.js';
import { configureGoogleStrategy } from './infrastructure/auth/strategies/GoogleStrategy.js';
import { configureJwtStrategy } from './infrastructure/auth/strategies/JwtStrategy.js';
import { configureLocalStrategy } from './infrastructure/auth/strategies/LocalStrategy.js';
import { cacheService } from './infrastructure/cache/RedisCacheService.js';
import { healthCheckService } from './infrastructure/health/HealthCheckService.js';
import { httpMetricsMiddleware, renderPrometheusMetrics } from './infrastructure/observability/HttpMetrics.js';
import { containerMiddleware, destroyContainer } from './presentation/di/container.js';
import { API_PREFIX, setupOpenAPI } from './presentation/docs/openapi.js';
import { correlationIdMiddleware } from './presentation/middleware/CorrelationIdMiddleware.js';
import { globalErrorHandler } from './presentation/middleware/GlobalErrorHandler.js';
import { generalRateLimiter } from './presentation/middleware/RateLimitMiddleware.js';
import authRoutes from './presentation/routes/authRoutes.js';
import categoryRoutes from './presentation/routes/categoryRoutes.js';
import recipeRoutes from './presentation/routes/recipeRoutes.js';

const app: Express = express();
const backgroundResources: Array<{ close: () => Promise<unknown> }> = [];

// Configure Passport
configureJwtStrategy(passport);
configureLocalStrategy(passport);
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  configureGoogleStrategy(passport);
}
app.use(passport.initialize());

// Global middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean),
}));
app.use(express.json());
app.use(correlationIdMiddleware);
app.use(pinoHttp({
  logger,
  customProps: (req, res) => ({
    correlationId: res.getHeader('X-Correlation-ID'),
    userId: req.user?.id,
    method: req.method,
    path: req.path,
  }),
  serializers: {
    req: (req: IncomingMessage) => ({
      method: req.method,
      url: typeof req.url === 'string' ? new URL(req.url, 'http://localhost').pathname : '',
    }),
  },
}));
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    if (durationMs > 500) {
      logger.warn({
        correlationId: res.getHeader('X-Correlation-ID'),
        userId: req.user?.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
      }, 'Slow HTTP request');
    }
  });
  next();
});
app.use(httpMetricsMiddleware);

// Health checks
app.get('/health', async (_req, res) => {
  const result = await healthCheckService.checkAll();
  const statusCode = result.status === 'Healthy' ? 200 : 503;
  res.status(statusCode).json(result);
});

app.get('/health/live', async (_req, res) => {
  const result = await healthCheckService.checkLiveness();
  res.json(result);
});

app.get('/health/ready', async (_req, res) => {
  const result = await healthCheckService.checkReadiness();
  const statusCode = result.status === 'Healthy' ? 200 : 503;
  res.status(statusCode).json(result);
});

app.get('/metrics', (_req, res) => {
  res.type('text/plain; version=0.0.4; charset=utf-8').send(renderPrometheusMetrics());
});

app.use(express.static(resolve(process.cwd(), env.SITEMAP_OUTPUT_DIR), { index: false }));

app.use(containerMiddleware);
app.use(generalRateLimiter);
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) res.setHeader('API-Version', 'v1');
  next();
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/recipes`, recipeRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
setupOpenAPI(app);

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

async function startBackgroundJobs(): Promise<void> {
  try {
    await cacheService.connect();
  } catch (err) {
    logger.warn({ err }, 'Redis unavailable; background jobs disabled');
    return;
  }

  try {
    const [imageQueue, sitemapQueue, welcomeQueue, imageWorker, sitemapWorker, welcomeWorker] = await Promise.all([
      import('./infrastructure/jobs/queues/imageResizeQueue.js'),
      import('./infrastructure/jobs/queues/sitemapQueue.js'),
      import('./infrastructure/jobs/queues/welcomeEmailQueue.js'),
      import('./infrastructure/jobs/workers/imageResizeWorker.js'),
      import('./infrastructure/jobs/workers/sitemapWorker.js'),
      import('./infrastructure/jobs/workers/welcomeEmailWorker.js'),
    ]);
    backgroundResources.push(
      imageWorker.imageResizeWorker,
      sitemapWorker.sitemapWorker,
      welcomeWorker.welcomeEmailWorker,
      imageQueue.imageResizeQueue,
      sitemapQueue.sitemapQueue,
      welcomeQueue.welcomeEmailQueue,
    );
    await sitemapQueue.scheduleSitemapJob();
  } catch (err) {
    logger.error({ err }, 'Failed to initialize background jobs');
    await Promise.allSettled(backgroundResources.map(resource => resource.close()));
    backgroundResources.length = 0;
  }
}

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  if (env.NODE_ENV !== 'test') void startBackgroundJobs();
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down...`);

  const backgroundResults = await Promise.allSettled(
    backgroundResources.map(resource => resource.close()),
  );
  backgroundResults.forEach(result => {
    if (result.status === 'rejected') logger.error({ err: result.reason }, 'Failed to close background resource');
  });

  server.close(async () => {
    await destroyContainer();
    await disconnectPrisma();
    try {
      await shutdownTracing();
    } catch (error) {
      logger.error({ err: error }, 'Failed to flush OpenTelemetry on shutdown');
    }
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