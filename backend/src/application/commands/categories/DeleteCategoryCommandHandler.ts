import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';

import { AppError, NotFoundError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';

import { DeleteCategoryCommand } from './CategoryCommands.js';

export class DeleteCategoryCommandHandler
  implements ICommandHandler<DeleteCategoryCommand, void>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: NodeCache,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const { categoryId } = command;

    const category = await this.prisma.category.findUnique({
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

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    // Invalidate categories cache (AC5)
    this.cache.del('categories:all');
  }
}
