import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

import { AppError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';
import { CategoryDto } from '../../dtos/CategoryDto.js';

import { CreateCategoryCommand } from './CategoryCommands.js';

export interface CacheService {
  deletePattern(pattern: string): Promise<void>;
}

export class CreateCategoryCommandHandler
  implements ICommandHandler<CreateCategoryCommand, CategoryDto>
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryDto> {
    const { name, description, imageUrl, orderIndex } = command.input;

    const baseSlug =
      slugify(name.trim(), { lower: true, strict: true, locale: 'vi' }) || 'category';

    let finalSlug = baseSlug;
    let counter = 2;

    while (await this.prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const category = await this.prisma.category.create({
          data: {
            name: name.trim(),
            slug: finalSlug,
            description: description ?? null,
            imageUrl: imageUrl ?? null,
            orderIndex: orderIndex ?? 0,
          },
        });

        await this.cache.deletePattern('categories:*');

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
          const target = (error as { meta?: { target?: string[] } })?.meta?.target ?? [];
          if (target.includes('slug') && attempt < MAX_RETRIES) {
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
            continue;
          }
          if (target.includes('slug')) {
            throw new AppError(
              409,
              'Xung đột đường dẫn định danh (slug) của danh mục',
              'CATEGORY_SLUG_CONFLICT',
              { title: 'Conflict' },
            );
          }
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
    throw new Error('Unexpected end of category creation loop');
  }
}
