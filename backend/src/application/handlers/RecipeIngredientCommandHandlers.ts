import { PrismaClient } from '@prisma/client';

import { ForbiddenError, NotFoundError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { RecipeIngredientDto } from '../dtos/RecipeDto.js';
import {
  AddRecipeIngredientCommand,
  DeleteRecipeIngredientCommand,
  UpdateRecipeIngredientCommand,
} from '../commands/recipes/RecipeCommands.js';
import { ICommandHandler } from '../command-bus.js';

export class AddRecipeIngredientCommandHandler implements ICommandHandler<AddRecipeIngredientCommand, RecipeIngredientDto> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: AddRecipeIngredientCommand): Promise<RecipeIngredientDto> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: command.recipeId, isDeleted: false } });
    if (!recipe) {
      throw new NotFoundError('Recipe');
    }

    if (recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }

    const payload: Record<string, unknown> = {
      recipeId: command.recipeId,
      name: command.name,
      quantity: command.quantity ?? null,
      unit: command.unit ?? null,
      notes: command.notes ?? null,
      orderIndex: command.orderIndex ?? 0,
    };

    if (!command.name || command.name.trim().length === 0) {
      throw new ValidationError({ name: ['Name is required'] });
    }

    if (command.quantity !== undefined && Number.isNaN(Number(command.quantity))) {
      throw new ValidationError({ quantity: ['Quantity must be a number'] });
    }

    const ingredient = await this.prisma.recipeIngredient.create({ data: payload as any });

    return {
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity !== null ? Number(ingredient.quantity) : undefined,
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      orderIndex: ingredient.orderIndex,
    };
  }
}

export class UpdateRecipeIngredientCommandHandler implements ICommandHandler<UpdateRecipeIngredientCommand, RecipeIngredientDto> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: UpdateRecipeIngredientCommand): Promise<RecipeIngredientDto> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: command.recipeId, isDeleted: false } });
    if (!recipe) {
      throw new NotFoundError('Recipe');
    }

    if (recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }

    const ingredient = await this.prisma.recipeIngredient.findFirst({
      where: { id: command.ingredientId, recipeId: command.recipeId, isDeleted: false },
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    const updateData: Record<string, unknown> = {};

    if (command.name !== undefined) {
      if (!command.name || command.name.trim().length === 0) {
        throw new ValidationError({ name: ['Name is required'] });
      }
      updateData.name = command.name;
    }

    if (command.quantity !== undefined) {
      if (Number.isNaN(Number(command.quantity))) {
        throw new ValidationError({ quantity: ['Quantity must be a number'] });
      }
      updateData.quantity = command.quantity;
    }

    if (command.unit !== undefined) updateData.unit = command.unit;
    if (command.notes !== undefined) updateData.notes = command.notes;
    if (command.orderIndex !== undefined) updateData.orderIndex = command.orderIndex;

    const updated = await this.prisma.recipeIngredient.update({
      where: { id: ingredient.id },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      quantity: updated.quantity !== null ? Number(updated.quantity) : undefined,
      unit: updated.unit ?? undefined,
      notes: updated.notes ?? undefined,
      orderIndex: updated.orderIndex,
    };
  }
}

export class DeleteRecipeIngredientCommandHandler implements ICommandHandler<DeleteRecipeIngredientCommand, void> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: DeleteRecipeIngredientCommand): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: command.recipeId, isDeleted: false } });
    if (!recipe) {
      throw new NotFoundError('Recipe');
    }

    if (recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }

    const ingredient = await this.prisma.recipeIngredient.findFirst({
      where: { id: command.ingredientId, recipeId: command.recipeId, isDeleted: false },
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    await this.prisma.recipeIngredient.update({
      where: { id: ingredient.id },
      data: { isDeleted: true },
    });
  }
}
