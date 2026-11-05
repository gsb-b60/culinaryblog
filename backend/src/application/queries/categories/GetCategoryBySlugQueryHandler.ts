import { Prisma, PrismaClient } from '@prisma/client';

import { RecipeDifficulty, RecipeStatus } from '../../../domain/index.js';
import { IQueryHandler } from '../../command-bus.js';
import { CategoryDetailDto } from '../../dtos/CategoryDto.js';
import { RecipeSummaryDto } from '../../dtos/RecipeDto.js';

import { GetCategoryBySlugQuery } from './CategoryQueries.js';

export class GetCategoryBySlugQueryHandler
  implements IQueryHandler<GetCategoryBySlugQuery, CategoryDetailDto | null>
{
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryDetailDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug: query.slug },
      include: {
        _count: {
          select: {
            recipes: {
              where: { status: 'PUBLISHED', isDeleted: false },
            },
          },
        },
      },
    });

    if (!category || category.isDeleted) {
      return null;
    }

    const recipeWhere: Prisma.RecipeWhereInput = {
      categoryId: category.id,
      isDeleted: false,
    };

    if (query.userId) {
      recipeWhere.OR = [
        { status: 'PUBLISHED' },
        { authorId: query.userId, status: 'DRAFT' },
      ];
    } else {
      recipeWhere.status = 'PUBLISHED';
    }

    const totalCount = await this.prisma.recipe.count({
      where: recipeWhere,
    });

    const skip = (query.page - 1) * query.pageSize;
    const recipes = await this.prisma.recipe.findMany({
      where: recipeWhere,
      skip: skip >= 0 ? skip : 0,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const items: RecipeSummaryDto[] = recipes.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      description: r.description,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      difficulty: r.difficulty as unknown as RecipeDifficulty,
      status: r.status as unknown as RecipeStatus,
      categoryId: r.categoryId,
      categoryName: r.category.name,
      authorId: r.authorId,
      authorName: r.author.displayName || r.author.fullName || undefined,
      publishedAt: r.publishedAt ?? undefined,
      createdAt: r.createdAt,
    }));

    const totalPages = query.pageSize > 0 ? Math.ceil(totalCount / query.pageSize) : 0;

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? undefined,
        imageUrl: category.imageUrl ?? undefined,
        orderIndex: category.orderIndex,
        recipeCount: category._count.recipes,
        createdAt: category.createdAt,
      },
      recipes: {
        items,
        totalCount,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }
}
