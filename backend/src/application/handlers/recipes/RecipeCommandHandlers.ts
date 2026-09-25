import { AppError, NotFoundError } from '../../../config-middleware/shared/errors/AppError.js';
import { Recipe } from '../../../domain/entities/Recipe.js';
import { RecipeStatus } from '../../../domain/enums/RecipeStatus.js';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository.js';
import { ICacheInvalidator } from '../../command-bus.js';
import {
  PublishRecipeCommand,
  UnpublishRecipeCommand,
} from '../../commands/recipes/RecipeCommands.js';
import { RecipeSummaryDto } from '../../dtos/RecipeDto.js';

/**
 * Converts the recipe aggregate into the response shape used by the API.
 * The lifecycle endpoints return the recipe summary DTO; related steps and
 * ingredients remain available through their dedicated endpoints.
 */
function toRecipeDto(recipe: Recipe): RecipeSummaryDto {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug.getValue(),
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    status: recipe.status,
    categoryId: recipe.categoryId,
    authorId: recipe.authorId,
    publishedAt: recipe.publishedAt,
    createdAt: recipe.createdAt,
  };
}

/**
 * Shared logic for publishing and unpublishing a recipe.
 * A recipe may only move from DRAFT to PUBLISHED, and publishing requires at
 * least one active execution step. Repeating a transition is deliberately
 * idempotent, so a second request does not fail or rewrite publishedAt.
 */
abstract class RecipeLifecycleHandler {
  constructor(protected readonly recipeRepository: IRecipeRepository) {}

  protected async findRecipeOrThrow(recipeId: string) {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new NotFoundError('Recipe');
    }
    return recipe;
  }

  protected async ensureCanPublish(recipeId: string): Promise<void> {
    const hasSteps = await this.recipeRepository.hasActiveSteps(recipeId);
    if (!hasSteps) {
      throw new AppError(
        422,
        'Recipe must have at least one execution step before publishing',
        'RECIPE_PUBLISH_INCOMPLETE',
        { title: 'Unprocessable Entity' },
      );
    }
  }
}

/** Handles the Draft -> Published lifecycle transition. */
export class PublishRecipeCommandHandler
  extends RecipeLifecycleHandler
  implements ICacheInvalidator
{
  constructor(recipeRepository: IRecipeRepository) {
    super(recipeRepository);
  }

  async execute(command: PublishRecipeCommand): Promise<RecipeSummaryDto> {
    const recipe = await this.findRecipeOrThrow(command.recipeId);

    // An already published recipe is valid and should not be updated again.
    if (recipe.status === RecipeStatus.PUBLISHED) {
      return toRecipeDto(recipe);
    }

    if (recipe.status !== RecipeStatus.DRAFT) {
      throw new AppError(422, 'Only draft recipes can be published', 'RECIPE_INVALID_STATUS', {
        title: 'Unprocessable Entity',
      });
    }

    await this.ensureCanPublish(command.recipeId);
    recipe.publish();
    const saved = await this.recipeRepository.save(recipe);
    return toRecipeDto(saved);
  }

  /** Return cache keys/patterns that can expose the changed publication state. */
  getCacheKeysToInvalidate(): string[] {
    return ['recipe:*', 'recipes:*', 'categories:*'];
  }
}

/** Handles the Published -> Draft lifecycle transition. */
export class UnpublishRecipeCommandHandler
  extends RecipeLifecycleHandler
  implements ICacheInvalidator
{
  constructor(recipeRepository: IRecipeRepository) {
    super(recipeRepository);
  }

  async execute(command: UnpublishRecipeCommand): Promise<RecipeSummaryDto> {
    const recipe = await this.findRecipeOrThrow(command.recipeId);

    // Unpublishing an already unpublished recipe is a successful no-op.
    if (recipe.status === RecipeStatus.DRAFT) {
      return toRecipeDto(recipe);
    }

    if (recipe.status !== RecipeStatus.PUBLISHED) {
      throw new AppError(
        422,
        'Only published recipes can be unpublished',
        'RECIPE_INVALID_STATUS',
        {
          title: 'Unprocessable Entity',
        },
      );
    }

    recipe.unpublish();
    const saved = await this.recipeRepository.save(recipe);
    return toRecipeDto(saved);
  }

  /** Publication state is included in public lists and detail responses. */
  getCacheKeysToInvalidate(): string[] {
    return ['recipe:*', 'recipes:*', 'categories:*'];
  }
}
