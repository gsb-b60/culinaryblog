import { Prisma, type PrismaClient } from '@prisma/client';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../config-middleware/shared/errors/AppError.js';
import { type IQueryHandler, Query, type ICommandHandler } from '../command-bus.js';
import {
  AddRecipeStepCommand,
  DeleteRecipeStepCommand,
  UpdateRecipeStepCommand,
} from '../commands/recipes/RecipeCommands.js';
import { type RecipeStepDto } from '../dtos/RecipeDto.js';

export interface RecipeStepCache {
  deletePattern(pattern: string): Promise<void>;
}

function toRecipeStepDto(step: {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes: number | null;
  imageUrl: string | null;
}): RecipeStepDto {
  return {
    id: step.id,
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    timerMinutes: step.timerMinutes ?? undefined,
    imageUrl: step.imageUrl ?? undefined,
  };
}

async function assertRecipeAccess(
  prisma: Prisma.TransactionClient,
  recipeId: string,
  userId: string,
  isAdmin: boolean,
): Promise<void> {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, isDeleted: false },
    select: { authorId: true },
  });
  if (!recipe) throw new NotFoundError('Recipe');
  if (!isAdmin && recipe.authorId !== userId) {
    throw new ForbiddenError('You are not allowed to modify this recipe');
  }
}

async function invalidateRecipeCache(cache: RecipeStepCache): Promise<void> {
  await cache.deletePattern('recipes:*');
}

function validateStepFields(title?: string, description?: string, timerMinutes?: number | null): void {
  const errors: Record<string, string[]> = {};
  if (title !== undefined && !title.trim()) errors.title = ['Title is required'];
  if (description !== undefined && !description.trim()) errors.description = ['Description is required'];
  if (timerMinutes !== undefined && timerMinutes !== null && (!Number.isInteger(timerMinutes) || timerMinutes < 0)) {
    errors.timerMinutes = ['Timer must be a non-negative integer'];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

async function renumberSteps(
  prisma: Prisma.TransactionClient,
  steps: Array<{ id: string }>,
): Promise<void> {
  for (let index = 0; index < steps.length; index += 1) {
    await prisma.recipeStep.update({
      where: { id: steps[index]!.id },
      data: { stepNumber: -(index + 1) },
    });
  }
  for (let index = 0; index < steps.length; index += 1) {
    await prisma.recipeStep.update({
      where: { id: steps[index]!.id },
      data: { stepNumber: index + 1, version: { increment: 1 } },
    });
  }
}

export class GetRecipeStepsQuery extends Query<RecipeStepDto[]> {
  readonly type = 'GetRecipeStepsQuery';

  constructor(
    public readonly recipeId: string,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}

export class GetRecipeStepsQueryHandler implements IQueryHandler<GetRecipeStepsQuery, RecipeStepDto[]> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetRecipeStepsQuery): Promise<RecipeStepDto[]> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: query.recipeId, isDeleted: false },
      select: { authorId: true },
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!query.isAdmin && recipe.authorId !== query.userId) {
      throw new ForbiddenError('You are not allowed to view this recipe');
    }

    const steps = await this.prisma.recipeStep.findMany({
      where: { recipeId: query.recipeId, isDeleted: false },
      orderBy: [{ stepNumber: 'asc' }, { id: 'asc' }],
    });
    return steps.map(toRecipeStepDto);
  }
}

export class AddRecipeStepCommandHandler implements ICommandHandler<AddRecipeStepCommand, string> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: RecipeStepCache,
  ) {}

  async execute(command: AddRecipeStepCommand): Promise<string> {
    validateStepFields(command.title, command.description, command.timerMinutes);
    try {
      const id = await this.prisma.$transaction(
        async (tx) => {
          await assertRecipeAccess(tx, command.recipeId, command.authorId, command.isAdmin);
          const existingSteps = await tx.recipeStep.findMany({
            where: { recipeId: command.recipeId },
            select: { stepNumber: true },
          });
          const stepNumber = existingSteps.reduce(
            (maximum, step) => Math.max(maximum, step.stepNumber),
            0,
          ) + 1;
          const step = await tx.recipeStep.create({
            data: {
              recipeId: command.recipeId,
              stepNumber,
              title: command.title.trim(),
              description: command.description.trim(),
              timerMinutes: command.timerMinutes ?? null,
              imageUrl: command.imageUrl ?? null,
            },
          });
          return step.id;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      await invalidateRecipeCache(this.cache);
      return id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' || error.code === 'P2002')) {
        throw new ConflictError('Recipe steps changed concurrently. Please retry.');
      }
      throw error;
    }
  }
}

export class UpdateRecipeStepCommandHandler implements ICommandHandler<UpdateRecipeStepCommand, void> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: RecipeStepCache,
  ) {}

  async execute(command: UpdateRecipeStepCommand): Promise<void> {
    validateStepFields(command.title, command.description, command.timerMinutes);
    try {
      await this.prisma.$transaction(async (tx) => {
        await assertRecipeAccess(tx, command.recipeId, command.authorId, command.isAdmin);
        const step = await tx.recipeStep.findFirst({
          where: { id: command.stepId, recipeId: command.recipeId, isDeleted: false },
        });
        if (!step) throw new NotFoundError('Recipe step');

        if (command.stepNumber !== undefined && command.stepNumber !== step.stepNumber) {
          const steps = await tx.recipeStep.findMany({
            where: { recipeId: command.recipeId, isDeleted: false },
            orderBy: [{ stepNumber: 'asc' }, { id: 'asc' }],
            select: { id: true },
          });
          if (!Number.isInteger(command.stepNumber) || command.stepNumber < 1 || command.stepNumber > steps.length) {
            throw new ValidationError({ stepNumber: [`Step number must be between 1 and ${steps.length}`] });
          }
          const currentIndex = steps.findIndex((item) => item.id === command.stepId);
          const [moving] = steps.splice(currentIndex, 1);
          steps.splice(command.stepNumber - 1, 0, moving!);
          await renumberSteps(tx, steps);
        }

        const data: Prisma.RecipeStepUpdateInput = {};
        if (command.title !== undefined) data.title = command.title.trim();
        if (command.description !== undefined) data.description = command.description.trim();
        if (command.timerMinutes !== undefined) data.timerMinutes = command.timerMinutes;
        if (command.imageUrl !== undefined) data.imageUrl = command.imageUrl;
        if (Object.keys(data).length) {
          data.version = { increment: 1 };
          await tx.recipeStep.update({ where: { id: command.stepId }, data });
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictError('Recipe steps changed concurrently. Please retry.');
      }
      throw error;
    }
    await invalidateRecipeCache(this.cache);
  }
}

export class DeleteRecipeStepCommandHandler implements ICommandHandler<DeleteRecipeStepCommand, void> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: RecipeStepCache,
  ) {}

  async execute(command: DeleteRecipeStepCommand): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await assertRecipeAccess(tx, command.recipeId, command.authorId, command.isAdmin);
        const step = await tx.recipeStep.findFirst({
          where: { id: command.stepId, recipeId: command.recipeId, isDeleted: false },
          select: { id: true },
        });
        if (!step) throw new NotFoundError('Recipe step');

        await tx.recipeStep.delete({ where: { id: step.id } });
        const remaining = await tx.recipeStep.findMany({
          where: { recipeId: command.recipeId, isDeleted: false },
          orderBy: [{ stepNumber: 'asc' }, { id: 'asc' }],
          select: { id: true },
        });
        await renumberSteps(tx, remaining);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictError('Recipe steps changed concurrently. Please retry.');
      }
      throw error;
    }
    await invalidateRecipeCache(this.cache);
  }
}
