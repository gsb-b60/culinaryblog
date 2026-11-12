import { Prisma, PrismaClient } from '@prisma/client';

import { ConflictError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../command-bus.js';
import { CreateRecipeCommand } from '../commands/recipes/RecipeCommands.js';
import { RecipeDto } from '../dtos/RecipeDto.js';

import { recipeInclude, toRecipeDto } from './RecipeStatusCommandHandlers.js';

export class CreateRecipeCommandHandler implements ICommandHandler<CreateRecipeCommand, RecipeDto> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly invalidateCache?: () => Promise<void>,
  ) {}

  async execute(command: CreateRecipeCommand): Promise<RecipeDto> {
    const input = command.input;
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) {
      throw new ValidationError({ categoryId: ['Category does not exist'] });
    }

    const slug = await this.createSlug(input.title);

    try {
      const recipe = await this.prisma.$transaction(async (tx) => tx.recipe.create({
        data: {
          title: input.title,
          slug,
          description: input.description,
          instructions: input.instructions,
          prepTime: input.prepTime,
          cookTime: input.cookTime,
          servings: input.servings,
          difficulty: input.difficulty,
          status: 'DRAFT',
          categoryId: input.categoryId,
          authorId: command.authorId,
          nutritionCalories: input.nutrition?.calories,
          nutritionProtein: input.nutrition?.protein,
          nutritionCarbohydrates: input.nutrition?.carbohydrates,
          nutritionFat: input.nutrition?.fat,
          nutritionFiber: input.nutrition?.fiber,
          nutritionSodium: input.nutrition?.sodium,
          steps: input.steps ? { create: input.steps } : undefined,
          ingredients: input.ingredients ? { create: input.ingredients } : undefined,
        },
        include: recipeInclude,
      }));
      await this.invalidateCache?.();
      return toRecipeDto(recipe);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('A recipe with this title already exists');
      }
      throw error;
    }
  }

  private async createSlug(title: string): Promise<string> {
    const base = title.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 220);
    if (!base) {
      throw new ValidationError({ title: ['Title must contain at least one letter or number'] });
    }
    const existing = await this.prisma.recipe.findUnique({ where: { slug: base }, select: { id: true } });
    if (existing) {
      throw new ConflictError('A recipe with this title already exists');
    }
    return base;
  }
}
