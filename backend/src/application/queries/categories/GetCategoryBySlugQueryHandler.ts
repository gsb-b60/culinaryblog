import { PrismaClient } from '@prisma/client';
import { CategoryDetailDto } from '../../dtos/CategoryDto.js';
import { createPagedResult } from '../../dtos/PagedResult.js';
import { IQueryHandler } from '../../command-bus.js';
import { GetCategoryBySlugQuery } from './CategoryQueries.js';

export class GetCategoryBySlugQueryHandler implements IQueryHandler<GetCategoryBySlugQuery, CategoryDetailDto | null> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryDetailDto | null> {
    const category = await this.prisma.category.findFirst({
      where: { slug: query.slug, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } },
        },
      },
    });

    if (!category) {
      return null;
    }

    const recipeWhere = {
      categoryId: category.id,
      status: 'PUBLISHED' as const,
      isDeleted: false,
    };
    const [recipes, totalCount] = await Promise.all([
      this.prisma.recipe.findMany({
        where: recipeWhere,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          prepTime: true,
          cookTime: true,
          servings: true,
          difficulty: true,
          status: true,
          categoryId: true,
          authorId: true,
          publishedAt: true,
          createdAt: true,
          author: { select: { displayName: true } },
        },
      }),
      this.prisma.recipe.count({ where: recipeWhere }),
    ]);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      recipeCount: category._count.recipes,
      recipes: createPagedResult(
        recipes.map(({ author, ...recipe }) => ({
          ...recipe,
          categoryName: category.name,
          authorName: author.displayName,
        })),
        query.page,
        query.pageSize,
        totalCount
      ),
    };
  }
}