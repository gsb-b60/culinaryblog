import { Router } from 'express';

import { createContainer } from '../di/container.js';

export function setupRoutes(app: Router): void {
  const container = createContainer();
  
  // Health checks (no container needed)
  app.get('/health', async (_req, res) => {
    const result = await container.healthCheckService.checkAll();
    const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(result);
  });

  app.get('/health/live', async (_req, res) => {
    const result = await container.healthCheckService.checkLiveness();
    res.json(result);
  });

  app.get('/health/ready', async (_req, res) => {
    const result = await container.healthCheckService.checkReadiness();
    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  });

  // API routes will be added here
  // import authRoutes from './authRoutes.js';
  // import recipeRoutes from './recipeRoutes.js';
  // import categoryRoutes from './categoryRoutes.js';
  // app.use('/api/v1/auth', authRoutes);
  // app.use('/api/v1/recipes', recipeRoutes);
  // app.use('/api/v1/categories', categoryRoutes);
}

export function setupOpenAPI(app: Router): void {
  // Scalar UI will be available at /scalar
  // This is a placeholder for OpenAPI spec generation
  app.get('/api-docs', (_req, res) => {
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'Culinary Blog API',
        version: '1.0.0',
        description: 'REST API for Culinary Blog',
      },
      servers: [{ url: '/api/v1' }],
      paths: {},
    });
  });
}