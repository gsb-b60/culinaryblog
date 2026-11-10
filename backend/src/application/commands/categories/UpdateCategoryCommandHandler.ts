import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';

import { AppError, NotFoundError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';
import { CategoryDto } from '../../dtos/CategoryDto.js';

import { UpdateCategoryCommand } from './CategoryCommands.js';

export class UpdateCategoryCommandHandler
  implements ICommandHandler<UpdateCategoryCommand, CategoryDto>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: NodeCache,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryDto> {
    const { categoryId, input } = command;

    const existing = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { recipes: { where: { isDeleted: false, status: 'PUBLISHED' } } },
        },
      },
    });

    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Category');
    }

    try {
      const updated = await this.prisma.category.update({
        where: { id: categoryId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
          // IMPORTANT (AC2): slug is deliberately NOT changed when name updates (prevent broken links)
        },
        include: {
          _count: {
            select: { recipes: { where: { isDeleted: false, status: 'PUBLISHED' } } },
          },
        },
      });

      // Invalidate category cache (AC5)
      this.cache.del('categories:all');

      return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description ?? undefined,
        imageUrl: updated.imageUrl ?? undefined,
        orderIndex: updated.orderIndex,
        recipeCount: updated._count.recipes,
        createdAt: updated.createdAt,
      };
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new AppError(
          409,
          'Danh mục với tên này đã tồn tại',
          'CATEGORY_NAME_EXISTS',
          { title: 'Conflict' },
        );
      }
      throw error;
    }
  }
}
