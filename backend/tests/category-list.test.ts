import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { commandBus } from '../src/application/command-bus.js';
import { GetCategoriesQuery } from '../src/application/queries/categories/CategoryQueries.js';
import { GetCategoriesQueryHandler } from '../src/application/queries/categories/GetCategoriesQueryHandler.js';

describe('GetCategoriesQuery', () => {
  it('uses the categories:all cache key with a 60-minute TTL', () => {
    const query = new GetCategoriesQuery();

    expect(query.getCacheKey()).toBe('categories:all');
    expect(query.getCacheTtl()).toBe(60 * 60);
  });

  it('returns categories with published recipe counts in name order', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'category-1',
        name: 'Breakfast',
        slug: 'breakfast',
        description: null,
        _count: { recipes: 3 },
      },
    ]);
    const prisma = { category: { findMany } } as unknown as PrismaClient;
    const handler = new GetCategoriesQueryHandler(prisma, new NodeCache());

    const result = await handler.execute(new GetCategoriesQuery());

    expect(findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { recipes: { where: { status: 'PUBLISHED' } } } },
      },
    });
    expect(result).toEqual([
      { id: 'category-1', name: 'Breakfast', slug: 'breakfast', description: undefined, recipeCount: 3 },
    ]);
  });

  it('returns an empty array when there are no categories', async () => {
    const prisma = {
      category: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient;
    const handler = new GetCategoriesQueryHandler(prisma, new NodeCache());

    await expect(handler.execute(new GetCategoriesQuery())).resolves.toEqual([]);
  });

  it('serves cached categories without querying the database', async () => {
    const findMany = vi.fn();
    const prisma = { category: { findMany } } as unknown as PrismaClient;
    const cache = new NodeCache();
    const query = new GetCategoriesQuery();
    const categories = [{ id: 'category-1', name: 'Breakfast', slug: 'breakfast', recipeCount: 3 }];
    cache.set(query.getCacheKey(), categories, query.getCacheTtl());
    const handler = new GetCategoriesQueryHandler(prisma, cache);

    await expect(handler.execute(query)).resolves.toEqual(categories);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns HTTP 200 from the public category list endpoint without authentication', async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'category-list-test-access-secret-32chars');
    vi.stubEnv('JWT_REFRESH_SECRET', 'category-list-test-refresh-secret-32chars');
    const { categoryListRoutes } = await import('../src/presentation/routes/categoryRoutes.js');
    commandBus.registerQueryHandler('GetCategoriesQuery', {
      execute: async () => [],
    });
    const app = express();
    app.use('/api/v1/categories', categoryListRoutes);

    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    vi.unstubAllEnvs();
  });
});
