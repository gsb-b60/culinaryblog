import { PrismaClient, RecipeStatus } from '@prisma/client';

import { ForbiddenError, NotFoundError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { type ICommandHandler } from '../command-bus.js';
import { PublishRecipeCommand, UnpublishRecipeCommand } from '../commands/recipes/RecipeCommands.js';

async function updatePublication(
  prisma: PrismaClient,
  command: { recipeId: string; authorId: string; isAdmin: boolean },
  targetStatus: RecipeStatus,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM recipes WHERE id = ${command.recipeId} FOR UPDATE`;

    const recipe = await tx.recipe.findFirst({
      where: { id: command.recipeId, isDeleted: false },
      select: { id: true, authorId: true, status: true },
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!command.isAdmin && recipe.authorId !== command.authorId) {
      throw new ForbiddenError('You are not allowed to modify this recipe');
    }

    if (recipe.status === targetStatus) return;

    if (targetStatus === RecipeStatus.PUBLISHED) {
      if (recipe.status !== RecipeStatus.DRAFT) {
        throw new ValidationError({ status: ['Only draft recipes can be published.'] });
      }
      const stepCount = await tx.recipeStep.count({
        where: { recipeId: recipe.id, isDeleted: false },
      });
      if (stepCount === 0) {
        throw new ValidationError({ steps: ['Add at least one cooking step before publishing.'] });
      }
    } else if (recipe.status !== RecipeStatus.PUBLISHED) {
      throw new ValidationError({ status: ['Only published recipes can be unpublished.'] });
    }

    await tx.recipe.update({
      where: { id: recipe.id },
      data: {
        status: targetStatus,
        publishedAt: targetStatus === RecipeStatus.PUBLISHED ? new Date() : null,
        updatedAt: new Date(),
        version: { increment: 1 },
      },
    });
  });
}

export class PublishRecipeCommandHandler implements ICommandHandler<PublishRecipeCommand, void> {
  constructor(private readonly prisma: PrismaClient) {}

  execute(command: PublishRecipeCommand): Promise<void> {
    return updatePublication(this.prisma, command, RecipeStatus.PUBLISHED);
  }
}

export class UnpublishRecipeCommandHandler implements ICommandHandler<UnpublishRecipeCommand, void> {
  constructor(private readonly prisma: PrismaClient) {}

  execute(command: UnpublishRecipeCommand): Promise<void> {
    return updatePublication(this.prisma, command, RecipeStatus.DRAFT);
  }
}
