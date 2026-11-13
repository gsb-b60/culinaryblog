import { Prisma, type PrismaClient } from '@prisma/client';

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { type ICommandHandler } from '../command-bus.js';
import { UpdateRecipeCommand } from '../commands/recipes/RecipeCommands.js';
import { type RecipeDto } from '../dtos/RecipeDto.js';

import { recipeInclude, toRecipeDto } from './RecipeStatusCommandHandlers.js';

export interface RecipeUpdateCache {
  deletePattern(pattern: string): Promise<void>;
}

export class UpdateRecipeCommandHandler implements ICommandHandler<UpdateRecipeCommand, RecipeDto> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: RecipeUpdateCache,
  ) {}

  async execute(command: UpdateRecipeCommand): Promise<RecipeDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: command.recipeId, isDeleted: false },
      select: { id: true, authorId: true, version: true, slug: true },
    });

    if (!recipe) throw new NotFoundError('Recipe');
    if (!command.isAdmin && recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }

    if (command.expectedVersion < 1 || !Number.isInteger(command.expectedVersion)) {
      throw new ValidationError({ 'If-Match': ['A valid recipe version is required'] });
    }

    if (command.input.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: command.input.categoryId },
        select: { id: true },
      });
      if (!category) throw new ValidationError({ categoryId: ['Category does not exist'] });
    }

    const input = command.input;
    const data: Prisma.RecipeUpdateInput = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.categoryId !== undefined ? { category: { connect: { id: input.categoryId } } } : {}),
      ...(input.prepTime !== undefined ? { prepTime: input.prepTime } : {}),
      ...(input.cookTime !== undefined ? { cookTime: input.cookTime } : {}),
      ...(input.servings !== undefined ? { servings: input.servings } : {}),
      ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.nutrition !== undefined
        ? {
            nutritionCalories: input.nutrition.calories,
            nutritionProtein: input.nutrition.protein,
            nutritionCarbohydrates: input.nutrition.carbohydrates,
            nutritionFat: input.nutrition.fat,
            nutritionFiber: input.nutrition.fiber,
            nutritionSodium: input.nutrition.sodium,
          }
        : {}),
      version: { increment: 1 },
    };

    try {
      const updated = await this.prisma.recipe.update({
        where: {
          id: command.recipeId,
          isDeleted: false,
          version: command.expectedVersion,
          ...(!command.isAdmin ? { authorId: command.authorId } : {}),
        },
        data,
        include: recipeInclude,
      });

      await this.cache.deletePattern('recipes:*');
      await this.cache.deletePattern('categories:*');
      return toRecipeDto(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ConflictError('Recipe changed while updating; reload and retry');
        }
        if (error.code === 'P2002') {
          throw new ConflictError('A recipe with this title already exists');
        }
      }
      throw error;
    }
  }
}
