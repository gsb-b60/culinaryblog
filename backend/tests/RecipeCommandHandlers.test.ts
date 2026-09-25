import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError, NotFoundError } from '../src/config-middleware/shared/errors/AppError.js';
import { RecipeDifficulty } from '../src/domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../src/domain/enums/RecipeStatus.js';
import { Recipe } from '../src/domain/entities/Recipe.js';
import { Slug } from '../src/domain/value-objects/Slug.js';
import { PublishRecipeCommand, UnpublishRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { IRecipeRepository } from '../src/domain/repositories/IRecipeRepository.js';
import { PublishRecipeCommandHandler, UnpublishRecipeCommandHandler } from '../src/application/handlers/recipes/RecipeCommandHandlers.js';

/** Creates a domain recipe so handler tests exercise the real lifecycle rules. */
function createRecipe(status: RecipeStatus): Recipe {
  return Recipe.reconstruct({
    id: 'recipe-1',
    title: 'Test recipe',
    slug: Slug.fromExisting('test-recipe'),
    description: 'Recipe description',
    instructions: 'Legacy instructions',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: RecipeDifficulty.EASY,
    status,
    categoryId: 'category-1',
    authorId: 'author-1',
    publishedAt: status === RecipeStatus.PUBLISHED ? new Date() : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    version: 1,
  });
}

/** Creates the repository methods used by the lifecycle handlers. */
function createRepository(recipe: Recipe | null, hasActiveSteps = true) {
  return {
    findById: vi.fn().mockResolvedValue(recipe),
    hasActiveSteps: vi.fn().mockResolvedValue(hasActiveSteps),
    save: vi.fn().mockImplementation(async (saved: Recipe) => saved),
  } as unknown as IRecipeRepository;
}

describe('recipe lifecycle handlers', () => {
  let recipe: Recipe;
  let repository: IRecipeRepository;

  beforeEach(() => {
    recipe = createRecipe(RecipeStatus.DRAFT);
    repository = createRepository(recipe);
  });

  it('publishes a draft that has at least one active execution step', async () => {
    const handler = new PublishRecipeCommandHandler(repository);

    const result = await handler.execute(new PublishRecipeCommand('recipe-1', 'author-1'));

    expect(result.status).toBe(RecipeStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('rejects publishing when no active execution step exists', async () => {
    repository = createRepository(recipe, false);
    const handler = new PublishRecipeCommandHandler(repository);

    await expect(
      handler.execute(new PublishRecipeCommand('recipe-1', 'author-1')),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'RECIPE_PUBLISH_INCOMPLETE',
    } satisfies Partial<AppError>);
  });

  it('keeps publishing idempotent for an already published recipe', async () => {
    const published = createRecipe(RecipeStatus.PUBLISHED);
    repository = createRepository(published);
    const handler = new PublishRecipeCommandHandler(repository);

    const result = await handler.execute(new PublishRecipeCommand('recipe-1', 'author-1'));

    expect(result.status).toBe(RecipeStatus.PUBLISHED);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.hasActiveSteps).not.toHaveBeenCalled();
  });

  it('unpublishes a published recipe', async () => {
    const published = createRecipe(RecipeStatus.PUBLISHED);
    repository = createRepository(published);
    const handler = new UnpublishRecipeCommandHandler(repository);

    const result = await handler.execute(new UnpublishRecipeCommand('recipe-1', 'author-1'));

    expect(result.status).toBe(RecipeStatus.DRAFT);
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('keeps unpublishing idempotent for a draft recipe', async () => {
    const handler = new UnpublishRecipeCommandHandler(repository);

    const result = await handler.execute(new UnpublishRecipeCommand('recipe-1', 'author-1'));

    expect(result.status).toBe(RecipeStatus.DRAFT);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('returns not found when the recipe does not exist', async () => {
    repository = createRepository(null);
    const handler = new PublishRecipeCommandHandler(repository);

    await expect(
      handler.execute(new PublishRecipeCommand('missing-recipe', 'author-1')),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
