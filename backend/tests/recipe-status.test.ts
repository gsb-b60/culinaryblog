import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import { CategoryRepository } from '../src/infrastructure/persistence/repositories/CategoryRepository.js';
import { GetRecipesQueryHandler, SearchRecipesQueryHandler, GetRecipeBySlugQueryHandler, GetCategoryBySlugQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import categoryRoutes from '../src/presentation/routes/categoryRoutes.js';
import { Prisma } from '@prisma/client';
import express from 'express';
import passport from 'passport';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ManagedRecipeQueryHandler } from '../src/application/handlers/ManagedRecipeQueryHandler.js';
import { GetManagedRecipesQuery } from '../src/application/queries/recipes/GetManagedRecipesQuery.js';
import { commandBus } from '../src/application/command-bus.js';
import { ArchiveRecipeCommand, PublishRecipeCommand, UnpublishRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { ArchiveRecipeCommandHandler, PublishRecipeCommandHandler, UnpublishRecipeCommandHandler } from '../src/application/handlers/RecipeStatusCommandHandlers.js';
import { UserRole } from '../src/domain/enums/UserRole.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

const prisma = { category: { findUnique: vi.fn() }, recipe: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() } };
const cache = { deletePattern: vi.fn().mockResolvedValue(undefined) };
const archive = new ArchiveRecipeCommandHandler(prisma as never, cache);
const publish = new PublishRecipeCommandHandler(prisma as never, cache);
const unpublish = new UnpublishRecipeCommandHandler(prisma as never, cache);

function storedRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipe-1', authorId: 'owner-1', categoryId: 'category-1',
    title: 'Soup', slug: 'soup', description: 'A soup', instructions: null,
    prepTime: 10, cookTime: 20, servings: 2, difficulty: 'EASY', status: 'DRAFT',
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    publishedAt: null, version: 1, isDeleted: false,
    nutritionCalories: new Prisma.Decimal(0), nutritionProtein: null,
    nutritionCarbohydrates: null, nutritionFat: null, nutritionFiber: null, nutritionSodium: null,
    author: { displayName: 'Owner' }, category: { name: 'Soup' },
    steps: [{ id: 'step-1', stepNumber: 1, title: 'Boil', description: 'Boil water', timerMinutes: null, imageUrl: null }],
    ingredients: [{ id: 'ingredient-1', name: 'Water', quantity: new Prisma.Decimal('1.25'), unit: 'L', notes: null, orderIndex: 0 }],
    images: [{ id: 'image-1', originalUrl: 'https://example.com/soup.jpg', mediumUrl: null, thumbnailUrl: null, altText: null, isPrimary: true, orderIndex: 0 }],
    ...overrides,
  };
}

let app: express.Express;
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  prisma.recipe.findUnique.mockResolvedValue(storedRecipe());
  prisma.recipe.update.mockImplementation(async ({ data }) => ({
    ...storedRecipe(), ...data, version: 2,
  }));
  prisma.recipe.findMany.mockResolvedValue([storedRecipe()]);
  prisma.recipe.count.mockResolvedValue(1);
  commandBus.registerQueryHandler(GetManagedRecipesQuery.name, new ManagedRecipeQueryHandler(prisma as never));
  commandBus.registerCommandHandler(ArchiveRecipeCommand.name, archive);
  commandBus.registerCommandHandler(PublishRecipeCommand.name, publish);
  commandBus.registerCommandHandler(UnpublishRecipeCommand.name, unpublish);
  // Stub only credential verification; routes, auth middleware, bus, handlers and error mapping run normally.
  vi.spyOn(passport, 'authenticate').mockImplementation(((_strategy: unknown, _options: unknown, callback: any) =>
    (req: express.Request, _res: express.Response, _next: express.NextFunction) => {
      const token = req.headers.authorization;
      const id = token === 'Bearer owner' ? 'owner-1' : 'other-1';
      callback(null, token && ['Bearer owner', 'Bearer other', 'Bearer admin'].includes(token) ? {
        id, roles: [token === 'Bearer admin' ? UserRole.ADMIN : UserRole.AUTHOR],
        email: 'test@example.com', displayName: 'Test', isActive: true,
      } : false);
    }) as any);
  app = express();
  app.use(express.json());
  const repository = new RecipeRepository(prisma as never);
  commandBus.registerQueryHandler('GetRecipesQuery', new GetRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('SearchRecipesQuery', new SearchRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('GetRecipeBySlugQuery', new GetRecipeBySlugQueryHandler(prisma as never));
  commandBus.registerQueryHandler('GetCategoryBySlugQuery', new GetCategoryBySlugQueryHandler(new CategoryRepository(prisma as never), repository));
  app.use('/api/v1/recipes', recipeRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use(globalErrorHandler);
});

describe('Publish/unpublish recipe endpoints', () => {
  it('publishes as owner and returns the full DTO with updated timestamps', async () => {
    const response = await request(app).patch('/api/v1/recipes/recipe-1/publish').set('Authorization', 'Bearer owner')
      .send({ authorId: 'other-1', isAdmin: true });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'recipe-1', status: 'PUBLISHED', version: 2,
      authorName: 'Owner', categoryName: 'Soup', nutrition: { calories: 0 },
      ingredients: [{ quantity: 1.25 }], steps: [{ id: 'step-1' }], images: [{ id: 'image-1' }],
    });
    expect(response.body.updatedAt).toBe(response.body.publishedAt);
    expect(prisma.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'recipe-1', authorId: 'owner-1', isDeleted: false, version: 1,
        steps: { some: { isDeleted: false } },
      }),
      data: expect.objectContaining({ status: 'PUBLISHED', version: { increment: 1 }, updatedAt: expect.any(Date) }),
    }));
    expect(cache.deletePattern.mock.calls).toEqual([['recipes:*'], ['categories:*']]);
  });

  it('unpublishes without requiring a step and clears publishedAt', async () => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: 'PUBLISHED', steps: [] }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/unpublish').set('Authorization', 'Bearer owner');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('DRAFT');
    expect(response.body).not.toHaveProperty('publishedAt');
    expect(prisma.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'DRAFT', publishedAt: null }),
    }));
  });

  it.each(['publish', 'unpublish', 'archive'])('allows Admin to %s another author recipe', async action => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: action === 'publish' ? 'DRAFT' : 'PUBLISHED' }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer admin');
    expect(response.status).toBe(200);
    expect(prisma.recipe.update).toHaveBeenCalled();
  });

  it.each(['publish', 'unpublish', 'archive'])('returns 401 for %s without valid authentication', async action => {
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer invalid');
    expect(response.status).toBe(401);
    expect(prisma.recipe.findUnique).not.toHaveBeenCalled();
  });

  it.each(['publish', 'unpublish', 'archive'])('returns 403 for %s by another author even with forged body fields', async action => {
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action)
      .set('Authorization', 'Bearer other').send({ authorId: 'owner-1', isAdmin: true });
    expect(response.status).toBe(403);
    expect(prisma.recipe.update).not.toHaveBeenCalled();
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });

  it.each(['publish', 'unpublish', 'archive'])('returns 404 for %s of a missing or deleted recipe', async action => {
    prisma.recipe.findUnique.mockResolvedValue(null);
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer owner');
    expect(response.status).toBe(404);
    expect(prisma.recipe.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'recipe-1', isDeleted: false } }));
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('returns 422 with steps errors and does not write or invalidate cache when no live steps exist', async () => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ steps: [] }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/publish').set('Authorization', 'Bearer owner');
    expect(response.status).toBe(422);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body.errors.steps).toBeDefined();
    expect(prisma.recipe.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } } }),
    }));
    expect(prisma.recipe.update).not.toHaveBeenCalled();
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });

  it.each([['publish', 'PUBLISHED'], ['unpublish', 'DRAFT']])('is idempotent for %s', async (action, status) => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer owner');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(status);
    expect(response.body.version).toBe(1);
    expect(response.body.updatedAt).toBe(new Date('2026-01-01').toISOString());
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it.each(['publish', 'unpublish'])('rejects %s for archived recipes', async action => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: 'ARCHIVED' }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer owner');
    expect(response.status).toBe(422);
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('returns 409 when the guarded update no longer matches', async () => {
    prisma.recipe.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Changed', { code: 'P2025', clientVersion: '5.17.0' }));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/publish').set('Authorization', 'Bearer owner');
    expect(response.status).toBe(409);
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });

  it('returns a sanitized 500 and does not invalidate cache after a DB failure', async () => {
    prisma.recipe.update.mockRejectedValue(new Error('private DB detail'));
    const response = await request(app).patch('/api/v1/recipes/recipe-1/publish').set('Authorization', 'Bearer owner');
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('private DB detail');
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });

  it('checks ownership for commands dispatched outside HTTP too', async () => {
    await expect(publish.execute(new PublishRecipeCommand('recipe-1', 'other-1'))).rejects.toMatchObject({ statusCode: 403 });
    await expect(unpublish.execute(new UnpublishRecipeCommand('recipe-1', 'other-1'))).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });
});

describe('Protected management list', () => {
  it('lists only the signed-in author recipes, ignoring forged identity or role query parameters', async () => {
    const response = await request(app).get('/api/v1/recipes/manage?page=2&pageSize=5&userId=other-1&isAdmin=true')
      .set('Authorization', 'Bearer owner');
    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({ id: 'recipe-1', status: 'DRAFT', steps: [{ id: 'step-1' }] });
    expect(response.body.meta).toMatchObject({ page: 2, pageSize: 5 });
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isDeleted: false, authorId: 'owner-1' }, skip: 5, take: 5,
    }));
    expect(prisma.recipe.count).toHaveBeenCalledWith({ where: { isDeleted: false, authorId: 'owner-1' } });
  });

  it('allows Admin to list recipes from all authors', async () => {
    const response = await request(app).get('/api/v1/recipes/manage').set('Authorization', 'Bearer admin');
    expect(response.status).toBe(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isDeleted: false } }));
  });

  it('does not access the DB for an unauthenticated list request', async () => {
    const response = await request(app).get('/api/v1/recipes/manage');
    expect(response.status).toBe(401);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
  });

  it.each(['page=0', 'page=abc', 'pageSize=51', 'pageSize=-1'])('validates pagination: %s', async query => {
    const response = await request(app).get('/api/v1/recipes/manage?' + query).set('Authorization', 'Bearer owner');
    expect(response.status).toBe(422);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
  });

  it('reflects published and unpublished state in subsequent list responses', async () => {
    let current = storedRecipe();
    prisma.recipe.findUnique.mockImplementation(async () => current);
    prisma.recipe.findMany.mockImplementation(async () => [current]);
    prisma.recipe.update.mockImplementation(async ({ data }) => {
      current = { ...current, ...data, version: current.version + 1 };
      return current;
    });
    const call = (action: string) => request(app).patch('/api/v1/recipes/recipe-1/' + action).set('Authorization', 'Bearer owner');
    expect((await call('publish')).status).toBe(200);
    let list = await request(app).get('/api/v1/recipes/manage').set('Authorization', 'Bearer owner');
    expect(list.body.items[0].status).toBe('PUBLISHED');
    expect((await call('unpublish')).status).toBe(200);
    list = await request(app).get('/api/v1/recipes/manage').set('Authorization', 'Bearer owner');
    expect(list.body.items[0].status).toBe('DRAFT');
  });
});

describe('Archive recipe lifecycle', () => {
  it.each(['DRAFT', 'PUBLISHED'])('archives %s without removing content or publication history', async status => {
    const publishedAt = status === 'PUBLISHED' ? new Date('2026-02-01') : null;
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status, publishedAt, steps: [] }));
    const result = await request(app).patch('/api/v1/recipes/recipe-1/archive').set('Authorization', 'Bearer owner');
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ id: 'recipe-1', status: 'ARCHIVED', version: 2, ingredients: [{ name: 'Water' }] });
    expect(prisma.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'recipe-1', isDeleted: false, version: 1, status, authorId: 'owner-1' },
      data: { status: 'ARCHIVED', version: { increment: 1 }, updatedAt: expect.any(Date), publishedAt },
    }));
    expect(cache.deletePattern.mock.calls).toEqual([['recipes:*'], ['categories:*']]);
  });

  it('retries archive without incrementing version and invalidates caches again', async () => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: 'ARCHIVED' }));
    const result = await request(app).patch('/api/v1/recipes/recipe-1/archive').set('Authorization', 'Bearer owner');
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ status: 'ARCHIVED', version: 1 });
    expect(prisma.recipe.update).not.toHaveBeenCalled();
    expect(cache.deletePattern).toHaveBeenCalledTimes(2);
  });

  it('rejects commands from a non-owner outside HTTP', async () => {
    await expect(archive.execute(new ArchiveRecipeCommand('recipe-1', 'other-1'))).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('returns 409 for concurrent changes without invalidating caches', async () => {
    prisma.recipe.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Changed', { code: 'P2025', clientVersion: '5.17.0' }));
    const result = await request(app).patch('/api/v1/recipes/recipe-1/archive').set('Authorization', 'Bearer owner');
    expect(result.status).toBe(409);
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });
});

describe('Archived recipe visibility through HTTP, query handlers and repositories', () => {
  it('removes archived recipes from lists, search and category pages while retaining owner access', async () => {
    let current = storedRecipe({ status: 'PUBLISHED' });
    prisma.recipe.findUnique.mockImplementation(async () => current);
    prisma.recipe.update.mockImplementation(async ({ data }) => {
      current = { ...current, ...data, version: current.version + 1 };
      return current;
    });
    prisma.recipe.findMany.mockImplementation(async ({ where }) => current.status === where.status ? [current] : []);
    prisma.recipe.count.mockImplementation(async ({ where }) => current.status === where.status ? 1 : 0);
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-1', name: 'Soup', slug: 'soup-category', description: null, imageUrl: null,
      orderIndex: 0, createdAt: new Date(), updatedAt: new Date(), isDeleted: false, version: 1,
    });
    const paths = ['/api/v1/recipes', '/api/v1/recipes/search?q=soup', '/api/v1/categories/soup-category?page=1&pageSize=12'];
    for (const path of paths) {
      const before = await request(app).get(path);
      expect(before.status).toBe(200);
      expect((before.body.recipes ?? before.body).items).toHaveLength(1);
    }
    expect((await request(app).patch('/api/v1/recipes/recipe-1/archive').set('Authorization', 'Bearer owner')).status).toBe(200);
    for (const path of paths) {
      const after = await request(app).get(path);
      expect(after.status).toBe(200);
      expect((after.body.recipes ?? after.body).items).toEqual([]);
      expect((after.body.recipes ?? after.body).meta.totalCount).toBe(0);
    }
    for (const [, args] of prisma.recipe.findMany.mock.calls.entries()) {
      expect(args[0].where).toMatchObject({ status: 'PUBLISHED', isDeleted: false });
    }
    expect(current).toMatchObject({ status: 'ARCHIVED', isDeleted: false, ingredients: [{ name: 'Water' }] });
    const detail = await request(app).get('/api/v1/recipes/soup').set('Authorization', 'Bearer owner');
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ status: 'ARCHIVED', steps: [{ id: 'step-1' }], ingredients: [{ name: 'Water' }] });
  });

  it.each(['owner', 'admin'])('allows %s to view archived detail', async token => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: 'ARCHIVED' }));
    const result = await request(app).get('/api/v1/recipes/soup').set('Authorization', 'Bearer ' + token);
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('ARCHIVED');
  });

  it.each(['other', ''])('blocks private detail for viewer "%s"', async token => {
    prisma.recipe.findUnique.mockResolvedValue(storedRecipe({ status: 'ARCHIVED' }));
    const result = await request(app).get('/api/v1/recipes/soup').set('Authorization', token ? 'Bearer ' + token : '');
    expect(result.status).toBe(403);
    expect(result.body).not.toHaveProperty('ingredients');
  });

  it.each(['/api/v1/recipes?status=ARCHIVED', '/api/v1/recipes/search?q=soup&status=ARCHIVED'])('ignores forged public status filter: %s', async path => {
    prisma.recipe.findMany.mockResolvedValue([]);
    const result = await request(app).get(path);
    expect(result.status).toBe(200);
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'PUBLISHED', isDeleted: false }),
    }));
  });
});

describe('Public numeric query parameters', () => {
  it.each(['/api/v1/recipes', '/api/v1/recipes/search?q=soup'])('parses pagination and every time filter for %s', async path => {
    const separator = path.includes('?') ? '&' : '?';
    const result = await request(app).get(path + separator + 'page=2&pageSize=5&minPrepTime=0&maxPrepTime=20&minCookTime=5&maxCookTime=60');
    expect(result.status).toBe(200);
    expect(result.body.meta).toMatchObject({ page: 2, pageSize: 5 });
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5, take: 5,
      where: expect.objectContaining({
        status: 'PUBLISHED', prepTime: { gte: 0, lte: 20 }, cookTime: { gte: 5, lte: 60 },
      }),
    }));
  });

  it.each([
    'page=0', 'page=-1', 'page=abc', 'page=1.5', 'page=', 'page=1&page=2',
    'pageSize=51', 'pageSize=', 'minCookTime=-1', 'maxPrepTime=abc',
    'minPrepTime=', 'minCookTime=1&minCookTime=2', 'maxCookTime=Infinity',
  ])('rejects invalid numeric query %s before reading the database', async query => {
    const result = await request(app).get('/api/v1/recipes?' + query);
    expect(result.status).toBe(422);
    expect(prisma.recipe.findMany).not.toHaveBeenCalled();
  });
});
