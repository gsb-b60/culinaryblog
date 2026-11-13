import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import slugify from 'slugify';

import { AppError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';
import { CategoryDto } from '../../dtos/CategoryDto.js';

import { CreateCategoryCommand } from './CategoryCommands.js';

export class CreateCategoryCommandHandler
  implements ICommandHandler<CreateCategoryCommand, CategoryDto>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: NodeCache,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryDto> {
    const { name, description, imageUrl, orderIndex } = command.input;

    const baseSlug =
      slugify(name, { lower: true, strict: true, locale: 'vi' }) || 'category';

    let finalSlug = baseSlug;
    let counter = 2;

    while (await this.prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          name,
          slug: finalSlug,
          description: description ?? null,
          imageUrl: imageUrl ?? null,
          orderIndex: orderIndex ?? 0,
        },
      });

      // Invalidate category cache (AC7)
      this.cache.del('categories:all');

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        imageUrl: category.imageUrl ?? undefined,
        orderIndex: category.orderIndex,
        recipeCount: 0,
        createdAt: category.createdAt,
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
