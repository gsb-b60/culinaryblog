import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commandBus } from '../src/application/command-bus.js';
import { RecipeOverviewQueryHandler } from '../src/application/handlers/RecipeOverviewQueryHandler.js';
import { GetRecipeOverviewQuery } from '../src/application/queries/recipes/GetRecipeOverviewQuery.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';

const prisma = {
  recipe: { groupBy: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
};
const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks();
  prisma.recipe.groupBy.mockResolvedValue([
    { status: 'PUBLISHED', _count: { _all: 4 } }, { status: 'DRAFT', _count: { _all: 2 } },
    { status: 'ARCHIVED', _count: { _all: 1 } },
  ]);
  prisma.recipe.findMany.mockResolvedValue([]);
  commandBus.registerQueryHandler(GetRecipeOverviewQuery.name, new RecipeOverviewQueryHandler(prisma as never));
  vi.spyOn(passport, 'authenticate').mockImplementation(((_strategy: unknown, _options: unknown, callback: (err: unknown, user: unknown) => void) =>
    (req: express.Request) => callback(null, req.headers.authorization ? {
      id: 'owner-1', roles: [req.headers.authorization === 'Bearer admin' ? 'ADMIN' : 'AUTHOR'],
      isActive: true, email: 'test@example.invalid', displayName: 'Owner',
    } : false)) as never);
});
describe('Live dashboard overview', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/v1/recipes/manage/overview')).status).toBe(401);
    expect(prisma.recipe.groupBy).not.toHaveBeenCalled();
  });
  it('scopes counts and recent data to the author, ignoring client scope parameters', async () => {
    const response = await request(app).get('/api/v1/recipes/manage/overview?userId=other&isAdmin=true').set('Authorization', 'Bearer author');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ stats: { total: 7, published: 4, draft: 2, archived: 1 }, recentRecipes: [] });
    expect(prisma.recipe.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { isDeleted: false, authorId: 'owner-1' } }));
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isDeleted: false, authorId: 'owner-1' }, take: 5, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    }));
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Array), { isolationLevel: 'RepeatableRead' });
  });
  it('lets an admin see system totals while excluding deleted recipes', async () => {
    await request(app).get('/api/v1/recipes/manage/overview').set('Authorization', 'Bearer admin').expect(200);
    expect(prisma.recipe.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { isDeleted: false } }));
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isDeleted: false } }));
  });
  it('returns zero counts for an account without recipes', async () => {
    prisma.recipe.groupBy.mockResolvedValue([]);
    const response = await request(app).get('/api/v1/recipes/manage/overview').set('Authorization', 'Bearer author');
    expect(response.body.stats).toEqual({ total: 0, published: 0, draft: 0, archived: 0 });
  });
  it('returns a server failure rather than misleading zero statistics', async () => {
    prisma.recipe.groupBy.mockRejectedValue(new Error('database offline'));
    await request(app).get('/api/v1/recipes/manage/overview').set('Authorization', 'Bearer author').expect(500);
  });
});
