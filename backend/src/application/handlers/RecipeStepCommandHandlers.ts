import { Prisma, PrismaClient, type RecipeStep } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { type ICommandHandler } from '../command-bus.js';
import {
  AddRecipeStepCommand,
  DeleteRecipeStepCommand,
  UpdateRecipeStepCommand,
} from '../commands/recipes/RecipeCommands.js';
import { type RecipeStepDto } from '../dtos/RecipeDto.js';
import { recipeStepSchema } from '../validators/recipeValidators.js';

function toDto(step: RecipeStep): RecipeStepDto {
  return {
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    timerMinutes: step.timerMinutes ?? undefined,
    imageUrl: step.imageUrl ?? undefined,
  };
}

async function authorizeRecipe(
  tx: Prisma.TransactionClient,
  command: { recipeId: string; authorId: string; isAdmin: boolean },
): Promise<void> {
  // Serialize step mutations for this recipe, including concurrent additions.
  await tx.$queryRaw`SELECT id FROM recipes WHERE id = ${command.recipeId} FOR UPDATE`;
  const recipe = await tx.recipe.findUnique({
    where: { id: command.recipeId, isDeleted: false },
  });
  if (!recipe) throw new NotFoundError('Recipe');
  if (!command.isAdmin && recipe.authorId !== command.authorId) {
    throw new ForbiddenError('You are not allowed to modify this recipe');
  }
}

async function findStep(tx: Prisma.TransactionClient, recipeId: string, stepId: string) {
  const step = await tx.recipeStep.findFirst({
    where: { id: stepId, recipeId, isDeleted: false },
  });
  if (!step) throw new NotFoundError('Step');
  return step;
}

async function touchRecipe(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.recipe.update({
    where: { id },
    data: { updatedAt: new Date(), version: { increment: 1 } },
  });
}

export class AddRecipeStepCommandHandler implements ICommandHandler<
  AddRecipeStepCommand,
  RecipeStepDto
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: AddRecipeStepCommand): Promise<RecipeStepDto> {
    return this.prisma.$transaction(async (tx) => {
      await authorizeRecipe(tx, command);
      const input = recipeStepSchema.parse({
        title: command.title,
        description: command.description,
        timerMinutes: command.timerMinutes,
        imageUrl: command.imageUrl,
      });
      const maximum = await tx.recipeStep.aggregate({
        where: { recipeId: command.recipeId, isDeleted: false },
        _max: { stepNumber: true },
      });
      const step = await tx.recipeStep.create({
        data: {
          recipeId: command.recipeId,
          stepNumber: (maximum._max.stepNumber ?? 0) + 1,
          ...input,
        },
      });
      await touchRecipe(tx, command.recipeId);
      return toDto(step);
    });
  }
}

export class UpdateRecipeStepCommandHandler implements ICommandHandler<
  UpdateRecipeStepCommand,
  RecipeStepDto
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: UpdateRecipeStepCommand): Promise<RecipeStepDto> {
    return this.prisma.$transaction(async (tx) => {
      await authorizeRecipe(tx, command);
      const step = await findStep(tx, command.recipeId, command.stepId);
      const input = recipeStepSchema.parse({
        title: command.title,
        description: command.description,
        timerMinutes: command.timerMinutes,
        imageUrl: command.imageUrl,
      });
      const updated = await tx.recipeStep.update({
        where: { id: step.id },
        data: { ...input, version: { increment: 1 } },
      });
      await touchRecipe(tx, command.recipeId);
      return toDto(updated);
    });
  }
}

export class DeleteRecipeStepCommandHandler implements ICommandHandler<
  DeleteRecipeStepCommand,
  void
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(command: DeleteRecipeStepCommand): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await authorizeRecipe(tx, command);
      const step = await findStep(tx, command.recipeId, command.stepId);
      // Hard delete releases the unique (recipeId, stepNumber) slot.
      await tx.recipeStep.delete({ where: { id: step.id } });
      const remaining = await tx.recipeStep.findMany({
        where: { recipeId: command.recipeId, isDeleted: false },
        orderBy: { stepNumber: 'asc' },
      });
      // Ascending updates fill vacant slots without unique constraint collisions.
      for (const [index, item] of remaining.entries()) {
        if (item.stepNumber !== index + 1) {
          await tx.recipeStep.update({
            where: { id: item.id },
            data: { stepNumber: index + 1, version: { increment: 1 } },
          });
        }
      }
      await touchRecipe(tx, command.recipeId);
    });
  }
}
