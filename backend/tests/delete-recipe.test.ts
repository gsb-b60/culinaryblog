import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { DeleteRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { DeleteRecipeCommandHandler } from '../src/application/handlers/DeleteRecipeCommandHandler.js';

function setup(recipe: unknown = {
  id: 'recipe-1',
  authorId: 'owner',
  images: [
    { originalUrl: 'original', mediumUrl: 'medium', thumbnailUrl: 'thumb' },
    { originalUrl: 'original', mediumUrl: null, thumbnailUrl: null, isDeleted: true },
  ],
  steps: [{ imageUrl: 'step' }, { imageUrl: null }],
}) {
  const tx = {
    recipe: {
      findFirst: vi.fn().mockResolvedValue(recipe),
      delete: vi.fn().mockResolvedValue({}),
    },
    fileCleanupTask: { createMany: vi.fn().mockResolvedValue({ count: 4 }) },
  };
  const prisma = { $transaction: vi.fn((run) => run(tx)) };
  const invalidateCache = vi.fn().mockResolvedValue(undefined);
  return {
    tx,
    prisma,
    invalidateCache,
    handler: new DeleteRecipeCommandHandler(prisma as never, invalidateCache),
  };
}

describe('DeleteRecipeCommandHandler', () => {
  it('records unique image URLs, hard deletes the recipe, then invalidates cache', async () => {
    const { handler, tx, prisma, invalidateCache } = setup();

    await handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'));

    expect(tx.recipe.findFirst).toHaveBeenCalledWith({
      where: { id: 'recipe-1', isDeleted: false },
      include: { images: true, steps: true },
    });
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
    expect(invalidateCache).toHaveBeenCalledOnce();
  });

  it('allows an Admin to delete another author’s recipe', async () => {
    const { handler, tx } = setup();

    await handler.execute(new DeleteRecipeCommand('recipe-1', 'admin', true));

    expect(tx.recipe.delete).toHaveBeenCalledOnce();
  });

  it('rejects a non-owner without enqueueing cleanup or deleting', async () => {
    const { handler, tx, invalidateCache } = setup();

    await expect(handler.execute(new DeleteRecipeCommand('recipe-1', 'other'))).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(tx.fileCleanupTask.createMany).not.toHaveBeenCalled();
    expect(tx.recipe.delete).not.toHaveBeenCalled();
    expect(invalidateCache).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing recipe', async () => {
    const { handler, tx, invalidateCache } = setup(null);

    await expect(handler.execute(new DeleteRecipeCommand('missing', 'owner'))).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(tx.recipe.delete).not.toHaveBeenCalled();
    expect(invalidateCache).not.toHaveBeenCalled();
  });

  it('does not delete if recording cleanup tasks fails', async () => {
    const { handler, tx, invalidateCache } = setup();
    tx.fileCleanupTask.createMany.mockRejectedValue(new Error('database unavailable'));

    await expect(handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'))).rejects.toThrow(
      'database unavailable',
    );
    expect(tx.recipe.delete).not.toHaveBeenCalled();
    expect(invalidateCache).not.toHaveBeenCalled();
  });

  it('deletes recipes without image URLs without creating cleanup tasks', async () => {
    const { handler, tx } = setup({ id: 'recipe-1', authorId: 'owner', images: [], steps: [] });

    await handler.execute(new DeleteRecipeCommand('recipe-1', 'owner'));

    expect(tx.fileCleanupTask.createMany).not.toHaveBeenCalled();
    expect(tx.recipe.delete).toHaveBeenCalledOnce();
  });
});
