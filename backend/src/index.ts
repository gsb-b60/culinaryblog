import cors from 'cors';
import express, { type Express } from 'express';
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
import { startFileCleanupWorker } from './infrastructure/jobs/workers/fileCleanupWorker.js';
import { imageResizeWorker } from './infrastructure/jobs/workers/imageResizeWorker.js';
import { sitemapWorker } from './infrastructure/jobs/workers/sitemapWorker.js';
import { welcomeEmailWorker } from './infrastructure/jobs/workers/welcomeEmailWorker.js';
import { containerMiddleware, createContainer, destroyContainer } from './presentation/di/container.js';
import { setupOpenAPI } from './presentation/docs/openapi.js';
import { correlationIdMiddleware } from './presentation/middleware/CorrelationIdMiddleware.js';
import { globalErrorHandler } from './presentation/middleware/GlobalErrorHandler.js';
import { generalRateLimiter } from './presentation/middleware/RateLimitMiddleware.js';
import authRoutes from './presentation/routes/authRoutes.js';
import categoryRoutes from './presentation/routes/categoryRoutes.js';
import recipeRoutes from './presentation/routes/recipeRoutes.js';

initTracing();

// Explicit annotation: without it, `declaration: true` cannot name the inferred
// type portably (TS2742) under pnpm's node_modules layout on CI.
const app: Express = express();

// Configure Passport
configureJwtStrategy(passport);
configureLocalStrategy(passport);
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  configureGoogleStrategy(passport);
}
app.use(passport.initialize());

// Global middleware
const allowedOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Scalar API reference UI (/scalar) loads its bundle from jsDelivr.
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'no-referrer' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS blocked: origin not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-Match'],
  }),
);
app.use(express.json({ limit: '1mb' }));
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
setupOpenAPI(app);
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

let fileCleanupWorker: { close: () => Promise<void> } | undefined;

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  
  // Initialize background job workers
  if (env.NODE_ENV !== 'test') {
    fileCleanupWorker = startFileCleanupWorker();
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
    fileCleanupWorker?.close(),
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