import { Prisma, type PrismaClient } from '@prisma/client';

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { RecipeDifficulty } from '../../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';
import { type ICommandHandler } from '../command-bus.js';
import { PublishRecipeCommand, UnpublishRecipeCommand } from '../commands/recipes/RecipeCommands.js';
import { type RecipeDto } from '../dtos/RecipeDto.js';

export interface RecipeStatusCache {
  deletePattern(pattern: string): Promise<void>;
}

export const recipeInclude = {
  steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
  ingredients: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
  images: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
  author: { select: { displayName: true } },
  category: { select: { name: true } },
} satisfies Prisma.RecipeInclude;

type RecipeWithDetails = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

export function toRecipeDto(recipe: RecipeWithDetails): RecipeDto {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    instructions: recipe.instructions ?? undefined,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty as RecipeDifficulty,
    status: recipe.status as RecipeStatus,
    categoryId: recipe.categoryId,
    categoryName: recipe.category.name,
    authorId: recipe.authorId,
    authorName: recipe.author.displayName,
    publishedAt: recipe.publishedAt ?? undefined,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    version: recipe.version,
    nutrition: {
      calories: recipe.nutritionCalories === null ? undefined : Number(recipe.nutritionCalories),
      protein: recipe.nutritionProtein === null ? undefined : Number(recipe.nutritionProtein),
      carbohydrates: recipe.nutritionCarbohydrates === null ? undefined : Number(recipe.nutritionCarbohydrates),
      fat: recipe.nutritionFat === null ? undefined : Number(recipe.nutritionFat),
      fiber: recipe.nutritionFiber === null ? undefined : Number(recipe.nutritionFiber),
      sodium: recipe.nutritionSodium === null ? undefined : Number(recipe.nutritionSodium),
    },
    steps: recipe.steps.map(step => ({
      id: step.id, stepNumber: step.stepNumber, title: step.title, description: step.description,
      timerMinutes: step.timerMinutes ?? undefined, imageUrl: step.imageUrl ?? undefined,
    })),
    ingredients: recipe.ingredients.map(ingredient => ({
      id: ingredient.id, name: ingredient.name,
      quantity: ingredient.quantity === null ? undefined : Number(ingredient.quantity),
      unit: ingredient.unit ?? undefined, notes: ingredient.notes ?? undefined, orderIndex: ingredient.orderIndex,
    })),
    images: recipe.images.map(image => ({
      id: image.id, originalUrl: image.originalUrl, mediumUrl: image.mediumUrl ?? undefined,
      thumbnailUrl: image.thumbnailUrl ?? undefined, altText: image.altText ?? undefined,
      isPrimary: image.isPrimary, orderIndex: image.orderIndex,
    })),
  };
}

class RecipeStatusHandler {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: RecipeStatusCache,
  ) {}

  protected async changeStatus(
    command: PublishRecipeCommand | UnpublishRecipeCommand,
    target: RecipeStatus.DRAFT | RecipeStatus.PUBLISHED,
  ): Promise<RecipeDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: command.recipeId, isDeleted: false },
      include: recipeInclude,
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!command.isAdmin && recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }
    if (recipe.status === RecipeStatus.ARCHIVED) {
      throw new ValidationError({ status: ['Archived recipes cannot be published or unpublished'] });
    }
    if (target === RecipeStatus.PUBLISHED && recipe.steps.length === 0) {
      throw new ValidationError({ steps: ['A recipe must have at least one execution step before publishing'] });
    }

    let result = recipe;
    if (recipe.status !== target) {
      const now = new Date();
      try {
        result = await this.prisma.recipe.update({
          // Check the observed version, ownership and live steps again at write time.
          where: {
            id: recipe.id,
            isDeleted: false,
            version: recipe.version,
            status: recipe.status,
            ...(!command.isAdmin ? { authorId: command.authorId } : {}),
            ...(target === RecipeStatus.PUBLISHED ? { steps: { some: { isDeleted: false } } } : {}),
          },
          data: {
            status: target,
            updatedAt: now,
            publishedAt: target === RecipeStatus.PUBLISHED ? now : null,
            version: { increment: 1 },
          },
          include: recipeInclude,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new ConflictError('Recipe changed while updating its status; reload and retry');
        }
        throw error;
      }
    }

    // Lists, search, detail and category counts can all depend on publication status.
    await this.cache.deletePattern('recipes:*');
    await this.cache.deletePattern('categories:*');
    return toRecipeDto(result);
  }
}

export class PublishRecipeCommandHandler extends RecipeStatusHandler implements ICommandHandler<PublishRecipeCommand, RecipeDto> {
  execute(command: PublishRecipeCommand): Promise<RecipeDto> {
    return this.changeStatus(command, RecipeStatus.PUBLISHED);
  }
}

export class UnpublishRecipeCommandHandler extends RecipeStatusHandler implements ICommandHandler<UnpublishRecipeCommand, RecipeDto> {
  execute(command: UnpublishRecipeCommand): Promise<RecipeDto> {
    return this.changeStatus(command, RecipeStatus.DRAFT);
  }
}
