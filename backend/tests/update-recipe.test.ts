import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { UpdateRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { UpdateRecipeCommandHandler } from '../src/application/handlers/UpdateRecipeCommandHandler.js';

const category = { id: 'category-1', name: 'Món Việt' };
const recipe = {
  id: 'recipe-1', title: 'Công thức cũ', slug: 'cong-thuc-cu', description: 'Mô tả công thức cũ',
  instructions: 'Cách làm', prepTime: 10, cookTime: 20, servings: 2, difficulty: 'EASY', status: 'DRAFT',
  categoryId: category.id, authorId: 'owner-1', publishedAt: null, createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'), version: 1, nutritionCalories: null, nutritionProtein: null,
  nutritionCarbohydrates: null, nutritionFat: null, nutritionFiber: null, nutritionSodium: null,
  author: { displayName: 'Owner' }, category, steps: [], ingredients: [], images: [],
};

function setup() {
  const updated = { ...recipe, title: 'Công thức mới', version: 2, updatedAt: new Date('2026-02-01') };
  const prisma = {
    recipe: {
      findUnique: vi.fn().mockResolvedValue({ id: recipe.id, authorId: recipe.authorId, version: recipe.version, slug: recipe.slug }),
      update: vi.fn().mockResolvedValue(updated),
    },
    category: { findUnique: vi.fn().mockResolvedValue(category) },
  } as any;
  const cache = { deletePattern: vi.fn().mockResolvedValue(undefined) };
  return { prisma, cache, updated, handler: new UpdateRecipeCommandHandler(prisma, cache) };
}

describe('UpdateRecipeCommandHandler', () => {
  it('updates the owner recipe with an optimistic version check and invalidates caches', async () => {
    const { handler, prisma, cache } = setup();
    const result = await handler.execute(new UpdateRecipeCommand('recipe-1', 'owner-1', { title: 'Công thức mới' }, 1));

    expect(prisma.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'recipe-1', isDeleted: false, version: 1, authorId: 'owner-1' },
      data: expect.objectContaining({ title: 'Công thức mới', version: { increment: 1 } }),
    }));
    expect(result).toMatchObject({ title: 'Công thức mới', version: 2 });
    expect(cache.deletePattern).toHaveBeenNthCalledWith(1, 'recipes:*');
    expect(cache.deletePattern).toHaveBeenNthCalledWith(2, 'categories:*');
  });

  it('allows an admin to update another owner recipe', async () => {
    const { handler, prisma } = setup();
    await handler.execute(new UpdateRecipeCommand('recipe-1', 'admin-1', { description: 'Mô tả mới' }, 1, true));
    expect(prisma.recipe.update.mock.calls[0][0].where).not.toHaveProperty('authorId');
  });

  it('rejects a non-owner', async () => {
    const { handler } = setup();
    await expect(handler.execute(new UpdateRecipeCommand('recipe-1', 'other', {}, 1))).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns 404 for a missing recipe', async () => {
    const { handler, prisma } = setup();
    prisma.recipe.findUnique.mockResolvedValue(null);
    await expect(handler.execute(new UpdateRecipeCommand('missing', 'owner-1', {}, 1))).rejects.toMatchObject({ statusCode: 404 });
  });

  it('maps a stale conditional update to 409', async () => {
    const { handler, prisma } = setup();
    prisma.recipe.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('stale', { code: 'P2025', clientVersion: '5.17.0' }));
    await expect(handler.execute(new UpdateRecipeCommand('recipe-1', 'owner-1', {}, 1))).rejects.toMatchObject({ statusCode: 409 });
  });
});
