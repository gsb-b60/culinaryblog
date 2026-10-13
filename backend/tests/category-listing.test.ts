import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GetCategoriesQueryHandler } from '../src/application/handlers/CategoryQueryHandlers.js';
import { GetCategoriesQuery } from '../src/application/queries/categories/CategoryQueries.js';
import { CategoryRepository } from '../src/infrastructure/persistence/repositories/CategoryRepository.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import categoryRoutes from '../src/presentation/routes/categoryRoutes.js';

const category = {
  id: '11111111-1111-4111-8111-111111111111', name: 'Main dishes', slug: 'main-dishes',
  description: null, imageUrl: null, orderIndex: 1,
  createdAt: new Date(), updatedAt: new Date(), isDeleted: false, version: 1,
  _count: { recipes: 3 },
};
const prisma = { category: {
  findMany: vi.fn().mockResolvedValue([category]),
  count: vi.fn().mockResolvedValue(51),
} };
const app = express();
app.use('/api/v1/categories', categoryRoutes);
app.use(globalErrorHandler);
beforeEach(() => {
  vi.clearAllMocks();
  commandBus.registerQueryHandler(
    GetCategoriesQuery.name, new GetCategoriesQueryHandler(new CategoryRepository(prisma as any)),
  );
});

describe('GET /api/v1/categories for the filter dropdown', () => {
  it('accepts numeric URL pagination and returns category DTOs with published recipe counts', async () => {
    const res = await request(app).get('/api/v1/categories?page=2&pageSize=50');
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toMatchObject({ id: category.id, name: category.name, recipeCount: 3 });
    expect(res.body.meta).toMatchObject({ page: 2, pageSize: 50, totalCount: 51, hasNextPage: false });
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isDeleted: false }, skip: 50, take: 50,
      include: { _count: { select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } } } },
    }));
  });

  it.each(['page=0', 'pageSize=51', 'page=abc', 'page=1&page=2'])('returns 422 for %s', async query => {
    const res = await request(app).get('/api/v1/categories?' + query);
    expect(res.status).toBe(422);
    expect(prisma.category.findMany).not.toHaveBeenCalled();
  });
});
