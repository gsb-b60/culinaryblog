import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { commandBus } from '../src/application/command-bus.js';
import { GetCategoriesQuery } from '../src/application/queries/categories/CategoryQueries.js';
import { GetCategoriesQueryHandler } from '../src/application/queries/categories/GetCategoriesQueryHandler.js';

describe('GetCategoriesQuery (Issue #15 — FR-CAT-001)', () => {
  it('uses the categories:all cache key with a 60-minute TTL (AC4)', () => {
    const query = new GetCategoriesQuery();

    expect(query.getCacheKey()).toBe('categories:all');
    expect(query.getCacheTtl()).toBe(60 * 60);
  });

  it('returns categories with published recipe counts in name order (AC1, AC2, AC3)', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'category-1',
        name: 'Breakfast',
        slug: 'breakfast',
        description: 'Morning dishes',
        imageUrl: 'https://example.com/breakfast.jpg',
        orderIndex: 1,
        createdAt: new Date('2026-01-01'),
        _count: { recipes: 5 },
      },
      {
        id: 'category-2',
        name: 'Dessert',
        slug: 'dessert',
        description: null,
        imageUrl: null,
        orderIndex: 2,
        createdAt: new Date('2026-01-02'),
        _count: { recipes: 2 },
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
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'category-1',
      name: 'Breakfast',
      slug: 'breakfast',
      description: 'Morning dishes',
      imageUrl: 'https://example.com/breakfast.jpg',
      recipeCount: 5,
    });
    expect(result[1]).toMatchObject({
      id: 'category-2',
      name: 'Dessert',
      slug: 'dessert',
      description: undefined,
      imageUrl: undefined,
      recipeCount: 2,
    });
  });

  it('returns an empty array when there are no categories (A1)', async () => {
    const prisma = {
      category: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient;
    const handler = new GetCategoriesQueryHandler(prisma, new NodeCache());

    await expect(handler.execute(new GetCategoriesQuery())).resolves.toEqual([]);
  });

  it('serves cached categories without querying the database on cache hit (AC5)', async () => {
    const findMany = vi.fn();
    const prisma = { category: { findMany } } as unknown as PrismaClient;
    const cache = new NodeCache();
    const query = new GetCategoriesQuery();
    const categories = [
      { id: 'category-1', name: 'Breakfast', slug: 'breakfast', recipeCount: 3 },
    ];
    cache.set(query.getCacheKey(), categories, query.getCacheTtl());
    const handler = new GetCategoriesQueryHandler(prisma, cache);

    const result = await handler.execute(query);

    expect(result).toEqual(categories);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns HTTP 200 from the public category list endpoint without authentication (AC1, AC6)', async () => {
    const { categoryListRoutes } = await import('../src/presentation/routes/categoryRoutes.js');
    commandBus.registerQueryHandler('GetCategoriesQuery', {
      execute: async () => [
        { id: 'cat-1', name: 'Món chính', slug: 'mon-chinh', recipeCount: 42 },
      ],
    });
    const app = express();
    app.use('/api/v1/categories', categoryListRoutes);

    const response = await request(app).get('/api/v1/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 'cat-1', name: 'Món chính', slug: 'mon-chinh', recipeCount: 42 },
    ]);
  });
});
