import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { DeleteRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { DeleteRecipeCommandHandler } from '../src/application/handlers/DeleteRecipeCommandHandler.js';
import {
  GetManageableRecipesQuery,
  GetManageableRecipesQueryHandler,
} from '../src/application/handlers/ManageableRecipeQueryHandler.js';

function setup(
  recipe: unknown = {
    id: 'recipe-1',
    authorId: 'owner',
    images: [
      { originalUrl: 'original', mediumUrl: 'medium', thumbnailUrl: 'thumb', isDeleted: true },
      { originalUrl: 'original', mediumUrl: null, thumbnailUrl: null },
    ],
    steps: [{ imageUrl: 'step' }, { imageUrl: null }],
  },
) {
  const tx = {
    recipe: {
      findUnique: vi.fn().mockResolvedValue(recipe),
      delete: vi.fn().mockResolvedValue({}),
    },
    fileCleanupTask: { createMany: vi.fn().mockResolvedValue({ count: 4 }) },
  };
  const prisma = { $transaction: vi.fn((run) => run(tx)) };
  const invalidate = vi.fn().mockResolvedValue(undefined);
  return {
    tx,
    prisma,
    invalidate,
    handler: new DeleteRecipeCommandHandler(prisma as never, invalidate),
  };
}

describe('Delete Recipe handler', () => {
  it('hard deletes, saves all unique image variants including deleted children, then invalidates cache', async () => {
    const { handler, tx, prisma, invalidate } = setup();
    await handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'));
    expect(tx.fileCleanupTask.createMany).toHaveBeenCalledWith({
      data: [
        { recipeId: 'recipe-1', url: 'original' },
        { recipeId: 'recipe-1', url: 'medium' },
        { recipeId: 'recipe-1', url: 'thumb' },
        { recipeId: 'recipe-1', url: 'step' },
      ],
    });
    expect(tx.recipe.delete).toHaveBeenCalledWith({ where: { id: 'recipe-1' } });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(invalidate).toHaveBeenCalledOnce();
  });
  it('allows Admin to delete another author recipe', async () => {
    const { handler, tx } = setup();
    await handler.execute(new DeleteRecipeCommand('recipe-1', 'admin', true));
    expect(tx.recipe.delete).toHaveBeenCalledOnce();
  });
  it('returns 403 for another author without saving tasks or deleting', async () => {
    const { handler, tx, invalidate } = setup();
    await expect(
      handler.execute(new DeleteRecipeCommand('recipe-1', 'other')),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(tx.recipe.delete).not.toHaveBeenCalled();
    expect(tx.fileCleanupTask.createMany).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
  it.each([false, true])('returns 404 for missing recipe, admin=%s', async (isAdmin) => {
    const { handler, tx } = setup(null);
    await expect(
      handler.execute(new DeleteRecipeCommand('missing', 'owner', isAdmin)),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(tx.recipe.delete).not.toHaveBeenCalled();
  });
  it('does not delete if writing cleanup tasks fails', async () => {
    const { handler, tx, invalidate } = setup();
    tx.fileCleanupTask.createMany.mockRejectedValue(new Error('database unavailable'));
    await expect(handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'))).rejects.toThrow(
      'database unavailable',
    );
    expect(tx.recipe.delete).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('does not invalidate cache when deletion fails', async () => {
    const { handler, tx, invalidate } = setup();
    tx.recipe.delete.mockRejectedValue(new Error('delete failed'));
    await expect(handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'))).rejects.toThrow(
      'delete failed',
    );
    expect(invalidate).not.toHaveBeenCalled();
  });
  it('deletes recipes without images without creating cleanup tasks', async () => {
    const { handler, tx } = setup({ id: 'recipe-1', authorId: 'owner', images: [], steps: [] });
    await handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'));
    expect(tx.fileCleanupTask.createMany).not.toHaveBeenCalled();
    expect(tx.recipe.delete).toHaveBeenCalledOnce();
  });
});

describe('Manageable recipes', () => {
  it.each([false, true])('filters by owner unless Admin=%s', async (isAdmin) => {
    const recipe = {
      findMany: vi
        .fn()
        .mockResolvedValue([{ id: 'r', title: 'Pho', author: { displayName: 'Owner' } }]),
      count: vi.fn().mockResolvedValue(1),
    };
    const prisma = { recipe, $transaction: (queries: Promise<unknown>[]) => Promise.all(queries) };
    const result = await new GetManageableRecipesQueryHandler(prisma as never).execute(
      new GetManageableRecipesQuery('owner', isAdmin, 2, 12),
    );
    expect(recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isDeleted: false, ...(isAdmin ? {} : { authorId: 'owner' }) },
        skip: 12,
        take: 12,
      }),
    );
    expect(result.items[0]).toMatchObject({ authorName: 'Owner' });
  });
});
