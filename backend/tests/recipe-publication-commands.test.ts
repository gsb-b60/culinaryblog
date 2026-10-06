import { RecipeStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../src/config-middleware/shared/errors/AppError.js';
import {
  PublishRecipeCommand,
  UnpublishRecipeCommand,
} from '../src/application/commands/recipes/RecipeCommands.js';
import {
  PublishRecipeCommandHandler,
  UnpublishRecipeCommandHandler,
} from '../src/application/handlers/RecipePublicationCommandHandlers.js';

const recipe = { id: 'recipe-1', authorId: 'author-1', status: RecipeStatus.DRAFT };
const tx = {
  $queryRaw: vi.fn().mockResolvedValue([]),
  recipe: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  recipeStep: {
    count: vi.fn(),
  },
};
const prisma = {
  $transaction: vi.fn(async (run: (transaction: typeof tx) => Promise<void>) => run(tx)),
} as never;

beforeEach(() => {
  vi.clearAllMocks();
  recipe.status = RecipeStatus.DRAFT;
  tx.recipe.findFirst.mockImplementation(async () => ({ ...recipe }));
  tx.recipe.update.mockImplementation(async ({ data }: { data: Partial<typeof recipe> }) => {
    Object.assign(recipe, data);
    return recipe;
  });
  tx.recipeStep.count.mockResolvedValue(1);
});

describe('recipe publication command handlers', () => {
  it('publishes a draft with at least one step and updates its version metadata', async () => {
    const handler = new PublishRecipeCommandHandler(prisma);

    await handler.execute(new PublishRecipeCommand('recipe-1', 'author-1'));

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.recipeStep.count).toHaveBeenCalledWith({
      where: { recipeId: 'recipe-1', isDeleted: false },
    });
    expect(tx.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'recipe-1' },
      data: expect.objectContaining({
        status: RecipeStatus.PUBLISHED,
        version: { increment: 1 },
      }),
    }));
    expect(recipe.status).toBe(RecipeStatus.PUBLISHED);
  });

  it('rejects publishing when the recipe has no active steps', async () => {
    tx.recipeStep.count.mockResolvedValue(0);
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'author-1')))
      .rejects.toMatchObject({ statusCode: 422, errors: { steps: expect.any(Array) } });
    expect(tx.recipe.update).not.toHaveBeenCalled();
  });

  it('is idempotent when the recipe is already published', async () => {
    recipe.status = RecipeStatus.PUBLISHED;
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'author-1'))).resolves.toBeUndefined();
    expect(tx.recipeStep.count).not.toHaveBeenCalled();
    expect(tx.recipe.update).not.toHaveBeenCalled();
  });

  it('rejects an author who does not own the recipe', async () => {
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'other-author')))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(tx.recipe.update).not.toHaveBeenCalled();
  });

  it('allows an admin to publish another author’s recipe', async () => {
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'admin-1', true))).resolves.toBeUndefined();
    expect(recipe.status).toBe(RecipeStatus.PUBLISHED);
  });

  it('unpublishes a published recipe and clears publishedAt', async () => {
    recipe.status = RecipeStatus.PUBLISHED;
    const handler = new UnpublishRecipeCommandHandler(prisma);

    await handler.execute(new UnpublishRecipeCommand('recipe-1', 'author-1'));

    expect(tx.recipe.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: RecipeStatus.DRAFT, publishedAt: null }),
    }));
    expect(recipe.status).toBe(RecipeStatus.DRAFT);
  });

  it('is idempotent when the recipe is already a draft', async () => {
    const handler = new UnpublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new UnpublishRecipeCommand('recipe-1', 'author-1'))).resolves.toBeUndefined();
    expect(tx.recipe.update).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or deleted recipe', async () => {
    tx.recipe.findFirst.mockResolvedValue(null);
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'author-1')))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects publishing an archived recipe', async () => {
    recipe.status = RecipeStatus.ARCHIVED;
    const handler = new PublishRecipeCommandHandler(prisma);

    await expect(handler.execute(new PublishRecipeCommand('recipe-1', 'author-1')))
      .rejects.toBeInstanceOf(ValidationError);
    expect(tx.recipe.update).not.toHaveBeenCalled();
  });
});
