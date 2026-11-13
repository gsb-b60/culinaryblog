import { Prisma } from '@prisma/client';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apicache from 'apicache';

import { commandBus } from '../src/application/command-bus.js';
import { GetRecipesQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

describe('FR-RCP-001: View Recipe List (Issue #20)', () => {
  const prisma = {
    recipe: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  function createPrismaRecipe(overrides: Record<string, unknown> = {}) {
    return {
      id: 'f87a8f1e-1234-4567-89ab-cdef01234567',
      authorId: 'author-1',
      categoryId: '11111111-1111-1111-1111-111111111111',
      title: 'Phở Bò Gia Truyền',
      slug: 'pho-bo-gia-truyen',
      description: 'Món phở bò truyền thống thơm ngon đậm đà',
      instructions: null,
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      difficulty: 'EASY',
      status: 'PUBLISHED',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
      updatedAt: new Date('2026-02-01T10:00:00.000Z'),
      publishedAt: new Date('2026-02-01T10:00:00.000Z'),
      version: 1,
      isDeleted: false,
      nutritionCalories: new Prisma.Decimal(450),
      nutritionProtein: null,
      nutritionCarbohydrates: null,
      nutritionFat: null,
      nutritionFiber: null,
      nutritionSodium: null,
      author: { displayName: 'Đầu Bếp Đức Anh' },
      category: { name: 'Món bún/phở' },
      ...overrides,
    };
  }

  let app: express.Express;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    apicache.clear();

    prisma.recipe.findMany.mockResolvedValue([createPrismaRecipe()]);
    prisma.recipe.count.mockResolvedValue(1);

    vi.spyOn(passport, 'authenticate').mockImplementation(((_strategy: unknown, _options: unknown, callback: any) =>
      (req: express.Request, _res: express.Response, _next: express.NextFunction) => {
        const token = req.headers.authorization;
        if (token === 'Bearer admin') {
          callback(null, {
            id: 'admin-1',
            roles: [UserRole.ADMIN],
            email: 'admin@lethimcook.com',
            displayName: 'Admin User',
            isActive: true,
          });
        } else if (token === 'Bearer author-1') {
          callback(null, {
            id: 'author-1',
            roles: [UserRole.AUTHOR],
            email: 'author@lethimcook.com',
            displayName: 'Author One',
            isActive: true,
          });
        } else if (token === 'Bearer author-2') {
          callback(null, {
            id: 'author-2',
            roles: [UserRole.AUTHOR],
            email: 'author2@lethimcook.com',
            displayName: 'Author Two',
            isActive: true,
          });
        } else {
          callback(null, false);
        }
      }) as any);

    const repository = new RecipeRepository(prisma as never);
    commandBus.registerQueryHandler('GetRecipesQuery', new GetRecipesQueryHandler(repository));

    app = express();
    app.use(express.json());
    app.use('/api/v1/recipes', recipeRoutes);
    app.use(globalErrorHandler);
  });

  it('AC1: Returns 200 with paginated recipe list', async () => {
    const res = await request(app).get('/api/v1/recipes?page=1&pageSize=12');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      title: 'Phở Bò Gia Truyền',
      status: 'PUBLISHED',
      authorName: 'Đầu Bếp Đức Anh',
      categoryName: 'Món bún/phở',
    });
  });

  it('AC2: Guests only see PUBLISHED recipes', async () => {
    await request(app).get('/api/v1/recipes');

    expect(prisma.recipe.findMany).toHaveBeenCalledOnce();
    const whereArg = prisma.recipe.findMany.mock.calls[0][0].where;
    expect(whereArg).toMatchObject({
      isDeleted: false,
      status: 'PUBLISHED',
    });
  });

  it('AC3: Author sees own DRAFT recipes additionally', async () => {
    await request(app)
      .get('/api/v1/recipes')
      .set('Authorization', 'Bearer author-1');

    expect(prisma.recipe.findMany).toHaveBeenCalledOnce();
    const whereArg = prisma.recipe.findMany.mock.calls[0][0].where;
    expect(whereArg.isDeleted).toBe(false);
    expect(whereArg.AND).toEqual([
      {
        OR: [
          { status: 'PUBLISHED' },
          {
            status: { in: ['DRAFT', 'ARCHIVED'] },
            authorId: 'author-1',
          },
        ],
      },
    ]);
  });

  it('AC4: Admin sees all statuses without restriction', async () => {
    await request(app)
      .get('/api/v1/recipes')
      .set('Authorization', 'Bearer admin');

    expect(prisma.recipe.findMany).toHaveBeenCalledOnce();
    const whereArg = prisma.recipe.findMany.mock.calls[0][0].where;
    expect(whereArg.isDeleted).toBe(false);
    expect(whereArg.status).toBeUndefined();
    expect(whereArg.AND).toBeUndefined();
  });

  it('AC5: Filters combine with AND (categoryId + difficulty + maxCookTime)', async () => {
    const catId = '11111111-1111-1111-1111-111111111111';
    await request(app).get(
      `/api/v1/recipes?categoryId=${catId}&difficulty=Easy&maxCookTime=30`,
    );

    expect(prisma.recipe.findMany).toHaveBeenCalledOnce();
    const whereArg = prisma.recipe.findMany.mock.calls[0][0].where;
    expect(whereArg).toMatchObject({
      isDeleted: false,
      categoryId: catId,
      difficulty: 'EASY',
      cookTime: { lte: 30 },
      status: 'PUBLISHED',
    });
  });

  it('AC6: Sort: -field = descending, default -createdAt', async () => {
    // Default sort: -createdAt
    await request(app).get('/api/v1/recipes');
    expect(prisma.recipe.findMany.mock.calls[0][0].orderBy).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);

    // Explicit sort: title (asc)
    await request(app).get('/api/v1/recipes?sort=title');
    expect(prisma.recipe.findMany.mock.calls[1][0].orderBy).toEqual([
      { title: 'asc' },
      { id: 'asc' },
    ]);

    // Explicit sort: -cookTime (desc)
    await request(app).get('/api/v1/recipes?sort=-cookTime');
    expect(prisma.recipe.findMany.mock.calls[2][0].orderBy).toEqual([
      { cookTime: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('AC7: Pagination metadata correct (totalCount, totalPages, hasNextPage, hasPreviousPage)', async () => {
    prisma.recipe.count.mockResolvedValue(25);
    const res = await request(app).get('/api/v1/recipes?page=2&pageSize=10');

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({
      page: 2,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('AC8: pageSize > 50 or page < 1 returns 422', async () => {
    const resPageSize = await request(app).get('/api/v1/recipes?pageSize=51');
    expect(resPageSize.status).toBe(422);
    expect(resPageSize.body).toMatchObject({
      status: 422,
      title: 'Validation Error',
    });

    const resPageZero = await request(app).get('/api/v1/recipes?page=0');
    expect(resPageZero.status).toBe(422);

    const resPageNeg = await request(app).get('/api/v1/recipes?page=-1');
    expect(resPageNeg.status).toBe(422);
  });

  it('AC9: Results cached (15-min TTL) for guests', async () => {
    // First call executes query and caches
    const res1 = await request(app).get('/api/v1/recipes?page=1&pageSize=5');
    expect(res1.status).toBe(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledTimes(1);

    // Second identical guest call returns from apicache without hitting repository again
    const res2 = await request(app).get('/api/v1/recipes?page=1&pageSize=5');
    expect(res2.status).toBe(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledTimes(1);
  });
});
