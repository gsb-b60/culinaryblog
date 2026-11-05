import { PrismaClient } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GetCategoryBySlugQuery } from '../src/application/queries/categories/CategoryQueries.js';
import { GetCategoryBySlugQueryHandler } from '../src/application/queries/categories/GetCategoryBySlugQueryHandler.js';

describe('GetCategoryBySlugQuery (Issue #16 — FR-CAT-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory = {
    id: 'category-1',
    name: 'Món chính',
    slug: 'mon-chinh',
    description: 'Các món ăn chính',
    imageUrl: 'https://example.com/mon-chinh.jpg',
    orderIndex: 1,
    createdAt: new Date('2026-01-01'),
    isDeleted: false,
    _count: { recipes: 5 },
  };

  it('valid slug returns 200 with category and paginated recipes (AC1, AC5)', async () => {
    const findUnique = vi.fn().mockResolvedValue(mockCategory);
    const count = vi.fn().mockResolvedValue(25);
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'recipe-1',
        title: 'Phở Bò Hà Nội',
        slug: 'pho-bo-ha-noi',
        description: 'Phở bò truyền thống',
        prepTime: 30,
        cookTime: 120,
        servings: 4,
        difficulty: 'MEDIUM',
        status: 'PUBLISHED',
        categoryId: 'category-1',
        authorId: 'author-1',
        publishedAt: new Date('2026-02-01'),
        createdAt: new Date('2026-02-01'),
        author: { id: 'author-1', displayName: 'Nguyễn Văn An', fullName: null },
        category: { id: 'category-1', name: 'Món chính', slug: 'mon-chinh' },
      },
    ]);

    const prisma = {
      category: { findUnique },
      recipe: { count, findMany },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    const result = await handler.execute(
      new GetCategoryBySlugQuery('mon-chinh', 2, 10),
    );

    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: 'mon-chinh' },
      include: {
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } },
        },
      },
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        categoryId: 'category-1',
        isDeleted: false,
        status: 'PUBLISHED',
      },
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, displayName: true, fullName: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    expect(result).not.toBeNull();
    expect(result?.category).toMatchObject({
      id: 'category-1',
      name: 'Món chính',
      slug: 'mon-chinh',
      recipeCount: 5,
    });
    expect(result?.recipes).toMatchObject({
      items: [
        {
          id: 'recipe-1',
          title: 'Phở Bò Hà Nội',
          slug: 'pho-bo-ha-noi',
          authorName: 'Nguyễn Văn An',
          categoryName: 'Món chính',
        },
      ],
      totalCount: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('only PUBLISHED recipes shown to guests without userId (AC2)', async () => {
    const findUnique = vi.fn().mockResolvedValue(mockCategory);
    const count = vi.fn().mockResolvedValue(1);
    const findMany = vi.fn().mockResolvedValue([]);

    const prisma = {
      category: { findUnique },
      recipe: { count, findMany },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    await handler.execute(new GetCategoryBySlugQuery('mon-chinh', 1, 12));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'category-1',
          isDeleted: false,
          status: 'PUBLISHED',
        },
      }),
    );
  });

  it('logged-in author additionally sees own DRAFT recipes in category (AC3)', async () => {
    const findUnique = vi.fn().mockResolvedValue(mockCategory);
    const count = vi.fn().mockResolvedValue(2);
    const findMany = vi.fn().mockResolvedValue([]);

    const prisma = {
      category: { findUnique },
      recipe: { count, findMany },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    await handler.execute(
      new GetCategoryBySlugQuery('mon-chinh', 1, 12, 'author-123', 'AUTHOR'),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'category-1',
          isDeleted: false,
          OR: [
            { status: 'PUBLISHED' },
            { authorId: 'author-123', status: 'DRAFT' },
          ],
        },
      }),
    );
  });

  it('invalid slug returns null (A1 / AC4)', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const prisma = {
      category: { findUnique },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    const result = await handler.execute(new GetCategoryBySlugQuery('not-exist'));

    expect(result).toBeNull();
  });

  it('soft-deleted category returns null', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      ...mockCategory,
      isDeleted: true,
    });
    const prisma = {
      category: { findUnique },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    const result = await handler.execute(new GetCategoryBySlugQuery('mon-chinh'));

    expect(result).toBeNull();
  });

  it('empty category returns 200 with empty items array (AC6)', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      ...mockCategory,
      _count: { recipes: 0 },
    });
    const count = vi.fn().mockResolvedValue(0);
    const findMany = vi.fn().mockResolvedValue([]);

    const prisma = {
      category: { findUnique },
      recipe: { count, findMany },
    } as unknown as PrismaClient;

    const handler = new GetCategoryBySlugQueryHandler(prisma);
    const result = await handler.execute(new GetCategoryBySlugQuery('mon-chinh'));

    expect(result).not.toBeNull();
    expect(result?.recipes.items).toEqual([]);
    expect(result?.recipes.totalCount).toBe(0);
    expect(result?.recipes.totalPages).toBe(0);
  });

  it('HTTP endpoint GET /api/v1/categories/:slug returns 200 with CategoryDetailDto', async () => {
    const { categoryListRoutes } = await import(
      '../src/presentation/routes/categoryRoutes.js'
    );

    commandBus.registerQueryHandler('GetCategoryBySlugQuery', {
      execute: async (query: GetCategoryBySlugQuery) => {
        if (query.slug === 'mon-chinh') {
          return {
            category: { id: 'c1', name: 'Món chính', slug: 'mon-chinh', recipeCount: 1 },
            recipes: {
              items: [{ id: 'r1', title: 'Phở', slug: 'pho' }],
              totalCount: 1,
              page: 1,
              pageSize: 12,
              totalPages: 1,
            },
          };
        }
        return null;
      },
    });

    const app = express();
    app.use('/api/v1/categories', categoryListRoutes);

    const resSuccess = await request(app).get('/api/v1/categories/mon-chinh?page=1&pageSize=12');
    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.category.name).toBe('Món chính');
    expect(resSuccess.body.recipes.items).toHaveLength(1);

    const resNotFound = await request(app).get('/api/v1/categories/khong-ton-tai');
    expect(resNotFound.status).toBe(404);
    expect(resNotFound.body).toMatchObject({
      type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
      title: 'Not Found',
      status: 404,
      detail: 'Category not found',
    });
  });
});
