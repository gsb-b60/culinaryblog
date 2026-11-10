import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GetCategoryBySlugQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { createPagedResult } from '../src/application/dtos/PagedResult.js';
import { GetCategoryBySlugQuery } from '../src/application/queries/categories/CategoryQueries.js';
import type { CategoryRepository } from '../src/infrastructure/persistence/repositories/CategoryRepository.js';
import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import type { IRecipeRepository } from '../src/domain/repositories/IRecipeRepository.js';
import categoryRoutes from '../src/presentation/routes/categoryRoutes.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';

const category = {
  id: 'category-1',
  name: 'Món chính',
  slug: { getValue: () => 'mon-chinh' },
  description: 'Các món ăn chính',
  imageUrl: undefined,
  orderIndex: 1,
  createdAt: new Date('2026-01-01'),
};

const emptyPage = createPagedResult([], 1, 12, 0);

describe('GetCategoryBySlugQueryHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the flat category detail and passes the viewer id for draft visibility', async () => {
    const categories = {
      findBySlug: vi.fn().mockResolvedValue(category),
    } as unknown as CategoryRepository;
    const recipes = {
      findPublishedByCategory: vi.fn().mockResolvedValue(emptyPage),
    } as unknown as IRecipeRepository;
    const handler = new GetCategoryBySlugQueryHandler(categories, recipes as unknown as RecipeRepository);

    const result = await handler.execute(
      new GetCategoryBySlugQuery('mon-chinh', 2, 12, 'user-1', 'AUTHOR'),
    );

    expect(categories.findBySlug).toHaveBeenCalledWith('mon-chinh');
    expect(recipes.findPublishedByCategory).toHaveBeenCalledWith(
      'category-1',
      2,
      12,
      undefined,
      'user-1',
    );
    expect(result).toMatchObject({
      id: 'category-1',
      name: 'Món chính',
      slug: 'mon-chinh',
      description: 'Các món ăn chính',
      orderIndex: 1,
      recipeCount: 0,
      recipes: emptyPage,
    });
  });

  it('does not request drafts for guests', async () => {
    const categories = {
      findBySlug: vi.fn().mockResolvedValue(category),
    } as unknown as CategoryRepository;
    const recipes = {
      findPublishedByCategory: vi.fn().mockResolvedValue(emptyPage),
    } as unknown as IRecipeRepository;
    const handler = new GetCategoryBySlugQueryHandler(categories, recipes as unknown as RecipeRepository);

    await handler.execute(new GetCategoryBySlugQuery('mon-chinh', 1, 12));

    expect(recipes.findPublishedByCategory).toHaveBeenCalledWith(
      'category-1',
      1,
      12,
      undefined,
      undefined,
    );
  });

  it('returns null when the category does not exist', async () => {
    const categories = {
      findBySlug: vi.fn().mockResolvedValue(null),
    } as unknown as CategoryRepository;
    const recipes = {
      findPublishedByCategory: vi.fn(),
    } as unknown as IRecipeRepository;
    const handler = new GetCategoryBySlugQueryHandler(categories, recipes as unknown as RecipeRepository);

    await expect(
      handler.execute(new GetCategoryBySlugQuery('missing', 1, 12)),
    ).resolves.toBeNull();
    expect(recipes.findPublishedByCategory).not.toHaveBeenCalled();
  });
});

describe('RecipeRepository.findPublishedByCategory draft visibility', () => {
  const prisma = {
    recipe: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.recipe.findMany.mockResolvedValue([]);
    prisma.recipe.count.mockResolvedValue(0);
  });

  it('includes only published recipes for guests', async () => {
    const repository = new RecipeRepository(prisma as never);

    await repository.findPublishedByCategory('category-1', 1, 12);

    expect(prisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'category-1',
          status: 'PUBLISHED',
          isDeleted: false,
        },
      }),
    );
  });

  it('includes the viewer own drafts alongside published recipes', async () => {
    const repository = new RecipeRepository(prisma as never);

    await repository.findPublishedByCategory('category-1', 1, 12, undefined, 'user-1');

    expect(prisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: 'category-1',
          isDeleted: false,
          OR: [
            { status: 'PUBLISHED' },
            { status: 'DRAFT', authorId: 'user-1' },
          ],
        },
      }),
    );
    expect(prisma.recipe.count).toHaveBeenCalledWith({
      where: {
        categoryId: 'category-1',
        isDeleted: false,
        OR: [
          { status: 'PUBLISHED' },
          { status: 'DRAFT', authorId: 'user-1' },
        ],
      },
    });
  });
});

describe('GET /api/v1/categories/:slug', () => {
  const app = express();
  app.use('/api/v1/categories', categoryRoutes);
  app.use(globalErrorHandler);

  beforeEach(() => {
    vi.restoreAllMocks();
    // Stub credential verification only; the route, optional auth middleware,
    // command bus and error mapping still run normally.
    vi.spyOn(passport, 'authenticate').mockImplementation(((_strategy: unknown, _options: unknown, callback: any) =>
      (_req: express.Request, _res: express.Response, _next: express.NextFunction) => {
        callback(null, false);
      }) as never);
  });

  it('returns a RFC 7807 404 when the category is missing', async () => {
    commandBus.registerQueryHandler('GetCategoryBySlugQuery', {
      execute: async () => null,
    });

    const response = await request(app).get('/api/v1/categories/missing');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      detail: 'Category not found',
    });
  });
});
