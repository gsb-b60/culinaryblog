import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commandBus } from '../src/application/command-bus.js';
import { ArchiveRecipeCommandHandler } from '../src/application/handlers/ArchiveRecipeCommandHandler.js';
import {
  GetRecipesQueryHandler, SearchRecipesQueryHandler, GetManageableRecipesQueryHandler, GetRecipeBySlugQueryHandler,
} from '../src/application/handlers/RecipeQueryHandlers.js';
import { RecipeRepository } from '../src/infrastructure/persistence/repositories/RecipeRepository.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const id = '44444444-4444-4444-8444-444444444444';
const missing = '55555555-5555-4555-8555-555555555555';
const secret = process.env.JWT_ACCESS_SECRET!;
const users = {
  [owner]: { id: owner, roles: ['AUTHOR'] },
  [other]: { id: other, roles: ['AUTHOR'] },
  [admin]: { id: admin, roles: ['AUTHOR', 'ADMIN'] },
};
const cache = { delete: vi.fn().mockResolvedValue(undefined), deletePattern: vi.fn().mockResolvedValue(undefined) };
let recipes: any[];
let app: express.Express;
const prisma = {
  recipe: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
};
function token(userId: string, expiresIn = 60) {
  return jwt.sign({ userId }, secret, { expiresIn });
}
function matches(recipe: any, where: any) {
  return !recipe.isDeleted && (!where.status || recipe.status === where.status) &&
    (!where.authorId || recipe.authorId === where.authorId) &&
    (!where.OR || where.OR.some((filter: any) => Object.entries(filter).some(([field, value]: any) =>
      recipe[field].toLowerCase().includes(value.contains.toLowerCase()))));
}

beforeEach(() => {
  vi.clearAllMocks();
  recipes = [{
    id, authorId: owner, title: 'Pho bo recipe', slug: 'pho-bo', description: 'A delicious recipe',
    status: 'PUBLISHED', isDeleted: false, version: 1,
    difficulty: 'EASY', categoryId: missing, prepTime: 10, cookTime: 20, servings: 2,
    createdAt: new Date(), updatedAt: new Date(), publishedAt: new Date(),
    category: { name: 'Main' }, author: { displayName: 'Author' },
    steps: [{ id: 'step-1', stepNumber: 1, title: 'Cook', description: 'Boil' }],
    ingredients: [{ id: 'ingredient-1', name: 'Beef', quantity: 1, orderIndex: 0 }],
    images: [{ id: 'image-1', originalUrl: 'https://example.com/pho.png', isPrimary: true, orderIndex: 0 }],
  }];
  prisma.recipe.findUnique.mockImplementation(async ({ where }) =>
    recipes.find(recipe => !recipe.isDeleted && (where.id ? recipe.id === where.id : recipe.slug === where.slug)) ?? null);
  prisma.recipe.findMany.mockImplementation(async ({ where, skip = 0, take = 12 }) =>
    recipes.filter(recipe => matches(recipe, where)).slice(skip, skip + take));
  prisma.recipe.count.mockImplementation(async ({ where }) => recipes.filter(recipe => matches(recipe, where)).length);
  prisma.recipe.update.mockImplementation(async ({ where, data }) => {
    const recipe = recipes.find(item => item.id === where.id)!;
    recipe.status = data.status;
    recipe.version += data.version.increment;
    return recipe;
  });
  const repository = new RecipeRepository(prisma as never);
  commandBus.registerCommandHandler('ArchiveRecipeCommand', new ArchiveRecipeCommandHandler(prisma as never, cache));
  commandBus.registerQueryHandler('GetRecipesQuery', new GetRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('SearchRecipesQuery', new SearchRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('GetManageableRecipesQuery', new GetManageableRecipesQueryHandler(repository));
  commandBus.registerQueryHandler('GetRecipeBySlugQuery', new GetRecipeBySlugQueryHandler(prisma as never));
  passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: secret,
  }, (payload, done) => done(null, users[payload.userId as keyof typeof users] ?? false)));
  app = express();
  app.use(express.json(), passport.initialize());
  app.use('/api/v1/recipes', recipeRoutes);
  app.use(globalErrorHandler);
});

describe('Archive Recipe HTTP flow', () => {
  it('archives for owner, keeps content in storage, hides public list/search/detail, retains management access', async () => {
    expect((await request(app).get('/api/v1/recipes')).body.meta.totalCount).toBe(1);
    const snapshot = structuredClone(recipes[0]);
    const response = await request(app).patch(`/api/v1/recipes/${id}/archive`).auth(token(owner), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id, status: 'ARCHIVED' });
    expect(recipes[0]).toMatchObject({
      status: 'ARCHIVED', isDeleted: false, version: 2,
      title: snapshot.title, publishedAt: snapshot.publishedAt,
      steps: snapshot.steps, ingredients: snapshot.ingredients, images: snapshot.images,
    });
    expect(prisma.recipe.update).toHaveBeenCalledWith({
      where: { id, isDeleted: false, authorId: owner },
      data: { status: 'ARCHIVED', version: { increment: 1 } },
    });
    expect(cache.deletePattern).toHaveBeenCalledWith('recipes:*');
    expect(cache.delete).toHaveBeenCalledWith('recipe:pho-bo');
    expect(prisma.recipe.update.mock.invocationCallOrder[0]).toBeLessThan(cache.delete.mock.invocationCallOrder[0]!);
    for (const path of ['/api/v1/recipes', '/api/v1/recipes/search?q=Pho', '/api/v1/recipes?status=ARCHIVED']) {
      const listing = await request(app).get(path);
      expect(listing.status).toBe(200);
      expect(listing.body.items).toEqual([]);
      expect(listing.body.meta.totalCount).toBe(0);
    }
    expect((await request(app).get('/api/v1/recipes/pho-bo')).status).toBe(404);
    const manageable = await request(app).get('/api/v1/recipes/manageable?status=ARCHIVED&page=1&pageSize=12')
      .auth(token(owner), { type: 'bearer' });
    expect(manageable.status).toBe(200);
    expect(manageable.body.items[0]).toMatchObject({ id, status: 'ARCHIVED' });
    expect((await request(app).get('/api/v1/recipes/pho-bo').auth(token(owner), { type: 'bearer' })).status).toBe(200);
    expect((await request(app).get('/api/v1/recipes/pho-bo').auth(token(other), { type: 'bearer' })).status).toBe(404);
    expect((await request(app).get('/api/v1/recipes/pho-bo').auth(token(admin), { type: 'bearer' })).status).toBe(200);
  });

  it('allows Admin to archive another author recipe', async () => {
    const response = await request(app).patch(`/api/v1/recipes/${id}/archive`).auth(token(admin), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(recipes[0].status).toBe('ARCHIVED');
  });

  it('returns 403 for another author without updating or invalidating cache', async () => {
    const response = await request(app).patch(`/api/v1/recipes/${id}/archive`).auth(token(other), { type: 'bearer' });
    expect(response.status).toBe(403);
    expect(prisma.recipe.update).not.toHaveBeenCalled();
    expect(cache.deletePattern).not.toHaveBeenCalled();
  });

  it.each([undefined, 'invalid', token(owner, -1)])('returns 401 for missing/invalid/expired JWT (%s)', async bearer => {
    const call = request(app).patch(`/api/v1/recipes/${id}/archive`);
    if (bearer) call.auth(bearer, { type: 'bearer' });
    expect((await call).status).toBe(401);
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it.each(['missing', 'deleted'])('returns 404 for a %s recipe', async kind => {
    if (kind === 'deleted') recipes[0].isDeleted = true;
    const response = await request(app).patch(`/api/v1/recipes/${kind === 'missing' ? missing : id}/archive`)
      .auth(token(owner), { type: 'bearer' });
    expect(response.status).toBe(404);
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('rejects malformed UUIDs with 422', async () => {
    expect((await request(app).patch('/api/v1/recipes/bad-id/archive')
      .auth(token(owner), { type: 'bearer' })).status).toBe(422);
  });

  it('archives a draft and makes a repeated request idempotent', async () => {
    recipes[0].status = 'DRAFT';
    for (let i = 0; i < 2; i++) {
      expect((await request(app).patch(`/api/v1/recipes/${id}/archive`)
        .auth(token(owner), { type: 'bearer' })).status).toBe(200);
    }
    expect(prisma.recipe.update).toHaveBeenCalledTimes(1);
    expect(recipes[0].version).toBe(2);
    expect(cache.deletePattern).toHaveBeenCalledTimes(8);
  });

  it('does not invalidate cache if database update fails', async () => {
    prisma.recipe.update.mockRejectedValueOnce(new Error('Database unavailable'));
    const response = await request(app).patch(`/api/v1/recipes/${id}/archive`)
      .auth(token(owner), { type: 'bearer' });
    expect(response.status).toBe(500);
    expect(cache.deletePattern).not.toHaveBeenCalled();
    expect(recipes[0].status).toBe('PUBLISHED');
  });

  it('enforces Author scope even if an authorId filter targets another user; Admin sees all', async () => {
    const mine = await request(app).get(`/api/v1/recipes/manageable?authorId=${owner}`)
      .auth(token(other), { type: 'bearer' });
    expect(mine.body.items).toEqual([]);
    const all = await request(app).get('/api/v1/recipes/manageable').auth(token(admin), { type: 'bearer' });
    expect(all.body.items).toHaveLength(1);
    expect((await request(app).get('/api/v1/recipes/manageable')).status).toBe(401);
  });

  it('never exposes drafts through public status filters or search', async () => {
    recipes[0].status = 'DRAFT';
    for (const path of ['/api/v1/recipes?status=DRAFT', '/api/v1/recipes/search?q=Pho&status=DRAFT']) {
      expect((await request(app).get(path)).body.items).toEqual([]);
    }
  });

  it('validates pagination coming from URL strings', async () => {
    expect((await request(app).get('/api/v1/recipes?page=1&pageSize=1')).status).toBe(200);
    for (const path of ['?page=0', '?pageSize=51', '?page=abc']) {
      expect((await request(app).get('/api/v1/recipes' + path)).status).toBe(422);
    }
  });
});
