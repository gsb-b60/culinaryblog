import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GetCategoriesQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { createPagedResult } from '../src/application/dtos/PagedResult.js';
import { CategoryRepository } from '../src/infrastructure/persistence/repositories/CategoryRepository.js';
import categoryRoutes from '../src/presentation/routes/categoryRoutes.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import { categoryPaginationSchema } from '../src/application/validators/categoryValidators.js';
import { paginationSchema } from '../src/application/validators/paginationValidators.js';

const rows = Array.from({ length: 5 }, (_, i) => ({
  id: `category-${i}`, name: `Category ${i}`, slug: `category-${i}`,
  description: null, imageUrl: null, orderIndex: 0, isDeleted: false, version: 1,
  createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  _count: { recipes: i },
}));
const prisma = { category: { findMany: vi.fn(), count: vi.fn() } };
const app = express();
app.use('/api/v1/categories', categoryRoutes);
app.use(globalErrorHandler);

beforeEach(() => {
  vi.clearAllMocks();
  prisma.category.findMany.mockImplementation(async ({ skip, take }) => rows.slice(skip, skip + take));
  prisma.category.count.mockResolvedValue(rows.length);
  commandBus.registerQueryHandler('GetCategoriesQuery', new GetCategoriesQueryHandler(new CategoryRepository(prisma as never)));
});

describe('Shared pagination contract', () => {
  it('preserves list-specific defaults and accepts HTTP query strings', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 12 });
    expect(categoryPaginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(categoryPaginationSchema.parse({ page: '2', pageSize: '50' })).toEqual({ page: 2, pageSize: 50 });
  });

  it.each([
    { page: '' }, { page: ['2'] }, { page: {} }, { page: 'abc' },
    { page: '1.5' }, { page: '9007199254740992' }, { pageSize: ['2'] },
  ])('rejects malformed pagination: %j', value => {
    expect(paginationSchema.safeParse(value).success).toBe(false);
  });

  it('handles empty lists and pages outside the result range', () => {
    expect(createPagedResult([], 1, 2, 0).meta).toEqual({
      page: 1, pageSize: 2, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false,
    });
    expect(createPagedResult([], 4, 2, 5).meta).toMatchObject({
      totalPages: 3, hasNextPage: false, hasPreviousPage: true,
    });
  });
});

describe('Category list pagination through HTTP, bus and repository', () => {
  it('returns disjoint pages, a partial final page, totals and boundary flags', async () => {
    const responses = [];
    for (const page of [1, 2, 3, 4]) {
      const response = await request(app).get(`/api/v1/categories?page=${page}&pageSize=2`);
      expect(response.status).toBe(200);
      responses.push(response.body);
    }
    expect(responses.map(r => r.items.map((c: { id: string }) => c.id))).toEqual([
      ['category-0', 'category-1'], ['category-2', 'category-3'], ['category-4'], [],
    ]);
    expect(responses[0].meta).toEqual({ page: 1, pageSize: 2, totalCount: 5, totalPages: 3, hasNextPage: true, hasPreviousPage: false });
    expect(responses[2].meta).toMatchObject({ hasNextPage: false, hasPreviousPage: true });
    expect(responses[3].meta).toMatchObject({ page: 4, totalCount: 5 });
    expect(responses[0].items[1].recipeCount).toBe(1);
    expect(prisma.category.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      skip: 2, take: 2, orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
    }));
  });

  it('uses the same filters for the count and page query', async () => {
    await request(app).get('/api/v1/categories?page=2&pageSize=2&searchQuery=Soup');
    const where = prisma.category.findMany.mock.calls[0][0].where;
    expect(where).toEqual({ isDeleted: false, OR: [
      { name: { contains: 'Soup', mode: 'insensitive' } },
      { description: { contains: 'Soup', mode: 'insensitive' } },
    ] });
    expect(prisma.category.count).toHaveBeenCalledWith({ where });
  });

  it.each(['page=0', 'page=-1', 'page=abc', 'page=1.5', 'page=', 'page=1&page=2', 'pageSize=51', 'pageSize=0', 'pageSize=', 'pageSize=2&pageSize=3'])(
    'returns 422 without querying storage for %s', async query => {
      const response = await request(app).get('/api/v1/categories?' + query);
      expect(response.status).toBe(422);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
      expect(prisma.category.count).not.toHaveBeenCalled();
    },
  );
});
