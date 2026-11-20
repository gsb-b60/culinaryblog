import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';

import { AppError, NotFoundError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';

import { DeleteCategoryCommand } from './CategoryCommands.js';
import { CategoryCache } from './CreateCategoryCommandHandler.js';

export class DeleteCategoryCommandHandler
  implements ICommandHandler<DeleteCategoryCommand, void>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CategoryCache | NodeCache,
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

    // Invalidate categories cache (AC5)
    if (typeof (this.cache as any)?.deletePattern === 'function') {
      await (this.cache as any).deletePattern('categories:*');
    }
    if (typeof (this.cache as any)?.del === 'function') {
      (this.cache as any).del('categories:all');
    }
  }
}
