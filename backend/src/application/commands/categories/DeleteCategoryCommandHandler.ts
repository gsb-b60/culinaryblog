import { PrismaClient } from '@prisma/client';

import { AppError, NotFoundError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';

import { DeleteCategoryCommand } from './CategoryCommands.js';
import { CacheService } from './CreateCategoryCommandHandler.js';

export class DeleteCategoryCommandHandler
  implements ICommandHandler<DeleteCategoryCommand, void>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const { categoryId } = command;

    const runDelete = async (tx: any) => {
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: { recipes: true },
          },
        },
      });

      if (!category || category.isDeleted) {
        throw new NotFoundError('Category');
      }

      const recipeCount = category._count.recipes;
      if (recipeCount > 0) {
        throw new AppError(
          409,
          `Cannot delete category because it still contains ${recipeCount} recipe(s). Please move all recipes to another category first.`,
          'CATEGORY_HAS_RECIPES',
          { title: 'Conflict' },
        );
      }

      try {
        await tx.category.update({
          where: { id: categoryId },
          data: { isDeleted: true },
        });
      } catch (error: unknown) {
        if ((error as { code?: string })?.code === 'P2003') {
          throw new AppError(
            409,
            'Cannot delete category because it still contains recipes. Please move all recipes to another category first.',
            'CATEGORY_HAS_RECIPES',
            { title: 'Conflict' },
          );
        }
        throw error;
      }
    };

    if (typeof this.prisma.$transaction === 'function') {
      await this.prisma.$transaction(runDelete);
    } else {
      await runDelete(this.prisma);
    }

    await this.cache.deletePattern('categories:*');
  }
}
