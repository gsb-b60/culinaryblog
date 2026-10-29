import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commandBus } from '../src/application/command-bus.js';
import { GetRecipesQueryHandler, SearchRecipesQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
const prisma = { recipe: { findMany: vi.fn(), count: vi.fn() } };
const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);
beforeEach(() => {
  vi.clearAllMocks();
  prisma.recipe.findMany.mockResolvedValue([]);
  prisma.recipe.count.mockResolvedValue(0);
  const repository = new RecipeRepository(prisma as never);
  commandBus.registerQueryHandler('GetRecipesQuery', new GetRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('SearchRecipesQuery', new SearchRecipesQueryHandler(repository));
});
describe('FR-SRCH-003 HTTP sorting', () => {
  it.each([
    ['', 'createdAt', 'desc'], ['sort=-createdAt', 'createdAt', 'desc'],
    ['sort=createdAt', 'createdAt', 'asc'], ['sort=title', 'title', 'asc'],
    ['sort=-title', 'title', 'desc'], ['sort=-cookTime', 'cookTime', 'desc'],
    ['sort=cookTime', 'cookTime', 'asc'], ['sort=prepTime', 'prepTime', 'asc'],
    ['sort=-prepTime', 'prepTime', 'desc'], ['sort=publishedAt', 'publishedAt', 'asc'],
    ['sort=-publishedAt', 'publishedAt', 'desc'], ['field=title&order=asc', 'title', 'asc'],
    ['sort=title&field=cookTime&order=desc', 'title', 'asc'],
  ])('%s maps to %s %s before pagination', async (query, field, order) => {
    await request(app).get('/api/v1/recipes?page=2&pageSize=2&' + query).expect(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ [field!]: order }, { id: 'asc' }], skip: 2, take: 2,
      where: { isDeleted: false, status: 'PUBLISHED' },
    }));
  });
  it.each(['sort=', 'sort=invalid', 'sort=--title', 'sort=title,cookTime',
    'sort=__proto__', 'sort=constructor', 'sort=title&sort=-title', 'sort[field]=title'])('rejects %s before storage', async query => {
    await request(app).get('/api/v1/recipes?' + query).expect(422);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
    expect(prisma.recipe.count).not.toHaveBeenCalled();
  });
  it('combines search and filters with sorting', async () => {
    await request(app).get('/api/v1/recipes/search?q=soup&sort=-cookTime&minServings=2').expect(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ cookTime: 'desc' }, { id: 'asc' }],
      where: expect.objectContaining({ status: 'PUBLISHED', isDeleted: false, servings: { gte: 2 } }),
    }));
  });
});
