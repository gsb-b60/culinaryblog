import { PrismaClient } from '@prisma/client';
import NodeCache from 'node-cache';
import { CategoryDto } from '../../dtos/CategoryDto.js';
import { IQueryHandler } from '../../command-bus.js';
import { GetCategoriesQuery } from './CategoryQueries.js';

export class GetCategoriesQueryHandler implements IQueryHandler<GetCategoriesQuery, CategoryDto[]> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: NodeCache
  ) {}

  async execute(query: GetCategoriesQuery): Promise<CategoryDto[]> {
    const cacheKey = query.getCacheKey();
    const cached = this.cache.get<CategoryDto[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED' } } },
        },
      },
    });

    const result = categories.map(({ id, name, slug, description, _count }) => ({
      id,
      name,
      slug,
      description: description ?? undefined,
      recipeCount: _count.recipes,
    }));

    this.cache.set(cacheKey, result, query.getCacheTtl());
    return result;
  }
}