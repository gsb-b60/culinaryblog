import { Prisma } from '@prisma/client';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apicache from 'apicache';

import { commandBus } from '../src/application/command-bus.js';
import { GetRecipeBySlugQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes, { recipeDetailCache } from '../src/presentation/routes/recipeRoutes.js';

describe('FR-RCP-002: View Recipe Detail (Issue #21)', () => {
  const prisma = {
    recipe: {
      findUnique: vi.fn(),
    },
  };

  function createFullRecipe(overrides: Record<string, unknown> = {}) {
    return {
      id: 'recipe-guid-1234',
      authorId: 'author-user-id',
      categoryId: 'category-guid-1111',
      title: 'Phở Bò Hà Nội Chuẩn Vị',
      slug: 'pho-bo-ha-noi-chuan-vi',
      description: 'Nước dùng trong ngọt thanh ninh từ xương bò',
      instructions: 'Hướng dẫn tổng quan về cách nấu phở',
      prepTime: 30,
      cookTime: 90,
      servings: 4,
      difficulty: 'MEDIUM',
      status: 'PUBLISHED',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
      updatedAt: new Date('2026-02-01T10:00:00.000Z'),
      publishedAt: new Date('2026-02-01T10:00:00.000Z'),
      version: 1,
      isDeleted: false,
      nutritionCalories: new Prisma.Decimal(520),
      nutritionProtein: new Prisma.Decimal(35.5),
      nutritionCarbohydrates: new Prisma.Decimal(65.2),
      nutritionFat: new Prisma.Decimal(12.8),
      nutritionFiber: new Prisma.Decimal(3.2),
      nutritionSodium: new Prisma.Decimal(850),
      author: { displayName: 'Bếp Trưởng Đức Anh' },
      category: { name: 'Món bún/phở' },
      steps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Sơ chế xương bò',
          description: 'Rửa sạch xương ống bò với nước muối loãng',
          timerMinutes: 15,
          imageUrl: 'https://example.com/step-1.jpg',
          isDeleted: false,
        },
        {
          id: 'step-2',
          stepNumber: 2,
          title: 'Ninh nước dùng phở',
          description: 'Ninh nhỏ lửa trong 90 phút vớt bọt liên tục',
          timerMinutes: 90,
          imageUrl: null,
          isDeleted: false,
        },
      ],
      ingredients: [
        {
          id: 'ing-1',
          name: 'Xương ống bò',
          quantity: new Prisma.Decimal(1000),
          unit: 'g',
          notes: 'Chọn xương tươi ngon',
          orderIndex: 0,
          isDeleted: false,
        },
        {
          id: 'ing-2',
          name: 'Bánh phở tươi',
          quantity: new Prisma.Decimal(500),
          unit: 'g',
          notes: null,
          orderIndex: 1,
          isDeleted: false,
        },
        {
          id: 'ing-3',
          name: 'Thịt bò tái',
          quantity: new Prisma.Decimal(300),
          unit: 'g',
          notes: 'Thái mỏng ngang thớ',
          orderIndex: 2,
          isDeleted: false,
        },
      ],
      images: [
        {
          id: 'img-1',
          originalUrl: 'https://example.com/pho-cover.jpg',
          mediumUrl: 'https://example.com/pho-cover-med.jpg',
          thumbnailUrl: 'https://example.com/pho-cover-thumb.jpg',
          altText: 'Tô phở bò nóng hổi',
          isPrimary: true,
          orderIndex: 0,
          isDeleted: false,
        },
      ],
      ...overrides,
    };
  }

  function createApp() {
    const app = express();
    app.use(express.json());
    app.use(passport.initialize());

    passport.authenticate = vi.fn((strategy: string) => {
      return (req: any, _res: any, next: any) => {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
          return next();
        }
        const token = auth.replace('Bearer ', '');
        if (token === 'admin-token') {
          req.user = { id: 'admin-user-id', roles: [UserRole.ADMIN] };
        } else if (token === 'owner-token') {
          req.user = { id: 'author-user-id', roles: [UserRole.AUTHOR] };
        } else if (token === 'other-author-token') {
          req.user = { id: 'other-user-id', roles: [UserRole.AUTHOR] };
        }
        next();
      };
    }) as any;

    app.use('/api/v1/recipes', recipeRoutes);
    app.use(globalErrorHandler);
    return app;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apicache.clear();
    commandBus.registerQueryHandler(
      'GetRecipeBySlugQuery',
      new GetRecipeBySlugQueryHandler(prisma as any),
    );
  });

  it('AC1: Published recipe returns 200 with full detail (nested steps, ingredients, images, nutrition, category, author)', async () => {
    const recipeData = createFullRecipe();
    prisma.recipe.findUnique.mockResolvedValue(recipeData);

    const app = createApp();
    const res = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 'recipe-guid-1234',
      title: 'Phở Bò Hà Nội Chuẩn Vị',
      slug: 'pho-bo-ha-noi-chuan-vi',
      authorId: 'author-user-id',
      authorName: 'Bếp Trưởng Đức Anh',
      categoryId: 'category-guid-1111',
      categoryName: 'Món bún/phở',
      status: 'PUBLISHED',
      difficulty: 'MEDIUM',
      prepTime: 30,
      cookTime: 90,
      servings: 4,
      instructions: 'Hướng dẫn tổng quan về cách nấu phở',
      nutrition: {
        calories: 520,
        protein: 35.5,
        carbohydrates: 65.2,
        fat: 12.8,
        fiber: 3.2,
        sodium: 850,
      },
    });
    expect(res.body.steps).toHaveLength(2);
    expect(res.body.ingredients).toHaveLength(3);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0].isPrimary).toBe(true);
  });

  it('AC2: Steps are sorted by stepNumber ascending', async () => {
    const recipeData = createFullRecipe({
      steps: [
        { id: 'step-1', stepNumber: 1, title: 'Bước 1', description: 'Desc 1', timerMinutes: 5, imageUrl: null },
        { id: 'step-2', stepNumber: 2, title: 'Bước 2', description: 'Desc 2', timerMinutes: 10, imageUrl: null },
        { id: 'step-3', stepNumber: 3, title: 'Bước 3', description: 'Desc 3', timerMinutes: 15, imageUrl: null },
      ],
    });
    prisma.recipe.findUnique.mockResolvedValue(recipeData);

    const app = createApp();
    const res = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');

    expect(res.status).toBe(200);
    const stepNumbers = res.body.steps.map((s: any) => s.stepNumber);
    expect(stepNumbers).toEqual([1, 2, 3]);
  });

  it('AC3: Ingredients are sorted by orderIndex ascending', async () => {
    const recipeData = createFullRecipe({
      ingredients: [
        { id: 'i1', name: 'Nguyên liệu 1', quantity: new Prisma.Decimal(10), unit: 'g', notes: null, orderIndex: 0 },
        { id: 'i2', name: 'Nguyên liệu 2', quantity: new Prisma.Decimal(20), unit: 'ml', notes: null, orderIndex: 1 },
        { id: 'i3', name: 'Nguyên liệu 3', quantity: new Prisma.Decimal(30), unit: 'thìa', notes: null, orderIndex: 2 },
      ],
    });
    prisma.recipe.findUnique.mockResolvedValue(recipeData);

    const app = createApp();
    const res = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');

    expect(res.status).toBe(200);
    const orderIndices = res.body.ingredients.map((i: any) => i.orderIndex);
    expect(orderIndices).toEqual([0, 1, 2]);
  });

  it('AC4: Draft recipe: author owner gets 200, Admin gets 200, others get 403', async () => {
    const draftRecipe = createFullRecipe({ status: 'DRAFT' });
    prisma.recipe.findUnique.mockResolvedValue(draftRecipe);

    const app = createApp();

    // 1. Author owner -> 200
    const ownerRes = await request(app)
      .get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi')
      .set('Authorization', 'Bearer owner-token');
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.status).toBe('DRAFT');

    // 2. Admin -> 200
    const adminRes = await request(app)
      .get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi')
      .set('Authorization', 'Bearer admin-token');
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.status).toBe('DRAFT');

    // 3. Other author -> 403
    const otherRes = await request(app)
      .get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi')
      .set('Authorization', 'Bearer other-author-token');
    expect(otherRes.status).toBe(403);

    // 4. Guest -> 403
    const guestRes = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');
    expect(guestRes.status).toBe(403);
  });

  it('AC4 (Archived): Archived recipe: author owner gets 200, Admin gets 200, others get 403', async () => {
    const archivedRecipe = createFullRecipe({ status: 'ARCHIVED' });
    prisma.recipe.findUnique.mockResolvedValue(archivedRecipe);

    const app = createApp();

    // 1. Author owner -> 200
    const ownerRes = await request(app)
      .get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi')
      .set('Authorization', 'Bearer owner-token');
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.status).toBe('ARCHIVED');

    // 2. Admin -> 200
    const adminRes = await request(app)
      .get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi')
      .set('Authorization', 'Bearer admin-token');
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.status).toBe('ARCHIVED');

    // 3. Guest -> 403
    const guestRes = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');
    expect(guestRes.status).toBe(403);
  });

  it('AC5: Non-existent slug returns 404 Not Found', async () => {
    prisma.recipe.findUnique.mockResolvedValue(null);

    const app = createApp();
    const res = await request(app).get('/api/v1/recipes/non-existent-slug');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      detail: 'Recipe not found',
    });
  });

  it('AC5 (Soft deleted): Soft-deleted recipe returns 404 Not Found', async () => {
    const deletedRecipe = createFullRecipe({ isDeleted: true });
    prisma.recipe.findUnique.mockResolvedValue(deletedRecipe);

    const app = createApp();
    const res = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      title: 'Not Found',
      status: 404,
      detail: 'Recipe not found',
    });
  });

  it('AC6: Results are cached with 60-min TTL for guests', async () => {
    const recipeData = createFullRecipe();
    prisma.recipe.findUnique.mockResolvedValue(recipeData);

    const app = createApp();

    // First request -> hits database
    const res1 = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');
    expect(res1.status).toBe(200);
    expect(prisma.recipe.findUnique).toHaveBeenCalledTimes(1);

    // Second request as guest -> served from cache, does NOT hit database again
    const res2 = await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');
    expect(res2.status).toBe(200);
    expect(prisma.recipe.findUnique).toHaveBeenCalledTimes(1);
    expect(res2.body.id).toBe(res1.body.id);
  });

  it('AC7: No N+1 queries (eager loading via Prisma include)', async () => {
    const recipeData = createFullRecipe();
    prisma.recipe.findUnique.mockResolvedValue(recipeData);

    const app = createApp();
    await request(app).get('/api/v1/recipes/pho-bo-ha-noi-chuan-vi');

    expect(prisma.recipe.findUnique).toHaveBeenCalledTimes(1);
    const callArgs = prisma.recipe.findUnique.mock.calls[0][0];

    // Verify include clause covers all related collections
    expect(callArgs.include).toMatchObject({
      steps: {
        where: { isDeleted: false },
        orderBy: { stepNumber: 'asc' },
      },
      ingredients: {
        where: { isDeleted: false },
        orderBy: { orderIndex: 'asc' },
      },
      images: {
        where: { isDeleted: false },
        orderBy: { orderIndex: 'asc' },
      },
      author: { select: { displayName: true } },
      category: { select: { name: true } },
    });
  });
});
