import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GetRecipesQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { GetRecipesQuery } from '../src/application/queries/recipes/RecipeQueries.js';
import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

const categoryId = '11111111-1111-4111-8111-111111111111';
const otherCategoryId = '22222222-2222-4222-8222-222222222222';

function recipe(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, title: 'Test recipe', slug: id, description: 'A delicious test recipe',
    categoryId, authorId: 'author-1', author: { displayName: 'Chef' },
    category: { name: 'Main dishes' }, prepTime: 5, cookTime: 30, servings: 2,
    difficulty: 'EASY', status: 'PUBLISHED', isDeleted: false, version: 1,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    publishedAt: new Date('2026-01-01'), ...overrides,
  };
}

const rows = [
  recipe('matching-1'), recipe('matching-2', { cookTime: 20, servings: 4 }),
  recipe('other-category', { categoryId: otherCategoryId }),
  recipe('medium', { difficulty: 'MEDIUM' }),
  recipe('hard', { difficulty: 'HARD' }),
  recipe('expert', { difficulty: 'EXPERT' }),
  recipe('slow', { cookTime: 31 }),
  recipe('small', { servings: 1 }),
  recipe('instant', { cookTime: 0 }),
  recipe('draft', { status: 'DRAFT' }),
  recipe('archived', { status: 'ARCHIVED' }),
  recipe('deleted', { isDeleted: true }),
];

// Emulate database comparisons so HTTP tests exercise the actual validator,
// command bus, handler and repository without a running PostgreSQL server.
function matches(row: Record<string, unknown>, where: Record<string, any>) {
  return Object.entries(where).every(([key, condition]) => {
    if (typeof condition === 'object') {
      const value = row[key] as number;
      return (condition.gte === undefined || value >= condition.gte)
        && (condition.lte === undefined || value <= condition.lte);
    }
    return row[key] === condition;
  });
}

const prisma = {
  recipe: {
    findMany: vi.fn(async ({ where, skip, take }) =>
      rows.filter(row => matches(row, where)).slice(skip, skip + take)),
    count: vi.fn(async ({ where }) => rows.filter(row => matches(row, where)).length),
  },
};
const repository = new RecipeRepository(prisma as any);
const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);

beforeEach(() => {
  vi.clearAllMocks();
  commandBus.registerQueryHandler(GetRecipesQuery.name, new GetRecipesQueryHandler(repository));
});

describe('GET /api/v1/recipes filtering', () => {
  it('returns published, non-deleted recipes with default pagination', async () => {
    const res = await request(app).get('/api/v1/recipes');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(9);
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 12, totalCount: 9 });
    expect(res.body.items.every((item: any) => item.status === 'PUBLISHED')).toBe(true);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/v1/recipes').query({ categoryId: otherCategoryId });
    expect(res.status).toBe(200);
    expect(res.body.items.map((item: any) => item.id)).toEqual(['other-category']);
    expect(res.body.meta.totalCount).toBe(1);
  });

  it.each(['Easy', 'Medium', 'Hard', 'Expert', 'EASY'])('accepts difficulty %s', async difficulty => {
    const res = await request(app).get('/api/v1/recipes').query({ difficulty });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items.every((item: any) => item.difficulty === difficulty.toUpperCase())).toBe(true);
  });

  it('includes the maximum cooking time boundary', async () => {
    const res = await request(app).get('/api/v1/recipes?maxCookTime=30');
    expect(res.status).toBe(200);
    expect(res.body.items.some((item: any) => item.cookTime === 30)).toBe(true);
    expect(res.body.items.every((item: any) => item.cookTime <= 30)).toBe(true);
    expect(res.body.meta.totalCount).toBe(8);
  });

  it('accepts zero cooking time', async () => {
    const res = await request(app).get('/api/v1/recipes?maxCookTime=0');
    expect(res.status).toBe(200);
    expect(res.body.items.map((item: any) => item.id)).toEqual(['instant']);
  });

  it('includes the minimum servings boundary', async () => {
    const res = await request(app).get('/api/v1/recipes?minServings=2');
    expect(res.status).toBe(200);
    expect(res.body.items.some((item: any) => item.servings === 2)).toBe(true);
    expect(res.body.items.every((item: any) => item.servings >= 2)).toBe(true);
    expect(res.body.meta.totalCount).toBe(8);
  });

  it('combines every filter with AND before pagination and counts all matches', async () => {
    const res = await request(app).get('/api/v1/recipes').query({
      categoryId, difficulty: 'Easy', maxCookTime: 30, minServings: 2,
      page: 2, pageSize: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.items.map((item: any) => item.id)).toEqual(['matching-2']);
    expect(res.body.meta).toEqual({
      page: 2, pageSize: 1, totalCount: 3, totalPages: 3,
      hasNextPage: true, hasPreviousPage: true,
    });
    const where = {
      isDeleted: false, status: 'PUBLISHED', categoryId, difficulty: 'EASY',
      cookTime: { lte: 30 }, servings: { gte: 2 },
    };
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where, skip: 1, take: 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }));
    expect(prisma.recipe.count).toHaveBeenCalledWith({ where });
  });

  it('returns an empty result when no recipes match', async () => {
    const res = await request(app).get('/api/v1/recipes?minServings=100');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.meta).toMatchObject({ totalCount: 0, totalPages: 0 });
  });

  it('keeps public listings published even when a draft status is requested', async () => {
    const res = await request(app).get('/api/v1/recipes?status=DRAFT');
    expect(res.status).toBe(200);
    expect(res.body.items.every((item: any) => item.status === 'PUBLISHED')).toBe(true);
  });

  it.each([
    ['difficulty', 'Unknown'], ['categoryId', 'not-a-uuid'],
    ['maxCookTime', '-1'], ['maxCookTime', '1.5'], ['maxCookTime', 'abc'],
    ['maxCookTime', ''], ['maxCookTime', '9007199254740992'],
    ['maxCookTime', '2147483648'], ['minServings', '2147483648'],
    ['minServings', '0'], ['minServings', '-1'], ['minServings', '2.5'],
    ['minServings', 'abc'], ['minServings', ''],
    ['page', '0'], ['pageSize', '51'], ['page', 'abc'],
  ])('returns 422 for invalid %s=%s without querying the database', async (field, value) => {
    const res = await request(app).get('/api/v1/recipes').query({ [field]: value });
    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty(field);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
    expect(prisma.recipe.count).not.toHaveBeenCalled();
  });

  it.each([
    'maxCookTime=20&maxCookTime=30',
    'maxCookTime[value]=30',
  ])('rejects repeated or structured numeric parameters: %s', async query => {
    const res = await request(app).get('/api/v1/recipes?' + query);
    expect(res.status).toBe(422);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
  });
});
