import { Prisma, PrismaClient } from '@prisma/client';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../command-bus.js';
import { DeleteRecipeCommand } from '../commands/recipes/RecipeCommands.js';

export class DeleteRecipeCommandHandler implements ICommandHandler<DeleteRecipeCommand, void> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly invalidateCache: () => Promise<void>,
  ) {}

  async execute(command: DeleteRecipeCommand): Promise<void> {
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const recipe = await tx.recipe.findUnique({
            where: { id: command.recipeId },
            include: { images: true, steps: true },
          });
          if (!recipe) throw new NotFoundError('Recipe');
          if (!command.isAdmin && recipe.authorId !== command.authorId) {
            throw new ForbiddenError('You can only delete your own recipes');
          }

          // Include soft-deleted children and every generated image variant.
          const urls = new Set<string>();
          for (const image of recipe.images) {
            for (const url of [image.originalUrl, image.mediumUrl, image.thumbnailUrl]) {
              if (url) urls.add(url);
            }
          }
          for (const step of recipe.steps) {
            if (step.imageUrl) urls.add(step.imageUrl);
          }
          // No foreign key to Recipe: these tasks must survive the hard delete.
          if (urls.size > 0) {
            await tx.fileCleanupTask.createMany({
              data: [...urls].map((url) => ({ recipeId: recipe.id, url })),
            });
          }
          await tx.recipe.delete({ where: { id: recipe.id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Recipe');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictError('Recipe changed concurrently. Please retry.');
      }
      throw error;
    }
    await this.invalidateCache();
  }
}
