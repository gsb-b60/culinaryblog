import { PrismaClient } from '@prisma/client';

import { IQueryHandler } from '../command-bus.js';
import { CategoryDetailDto, CategoryDto } from '../dtos/CategoryDto.js';
import { PagedResult, createPagedResult } from '../dtos/PagedResult.js';
import { GetCategoriesQuery, GetCategoryBySlugQuery } from '../queries/categories/CategoryQueries.js';

export class GetCategoriesQueryHandler implements IQueryHandler<GetCategoriesQuery, PagedResult<CategoryDto>> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetCategoriesQuery): Promise<PagedResult<CategoryDto>> {
    const where = {
      isDeleted: false,
      ...(query.filters.searchQuery
        ? {
            OR: [
              { name: { contains: query.filters.searchQuery, mode: 'insensitive' as const } },
              { description: { contains: query.filters.searchQuery, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [categories, totalCount] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { _count: { select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } } } },
      }),
      this.prisma.category.count({ where }),
    ]);
    return createPagedResult(categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      imageUrl: category.imageUrl ?? undefined,
      orderIndex: category.orderIndex,
      recipeCount: category._count.recipes,
      createdAt: category.createdAt,
    })), query.page, query.pageSize, totalCount);
  }
}

export class GetCategoryBySlugQueryHandler implements IQueryHandler<GetCategoryBySlugQuery, CategoryDetailDto | null> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryDetailDto | null> {
    const category = await this.prisma.category.findFirst({
      where: { slug: query.slug, isDeleted: false },
      include: {
        _count: { select: { recipes: { where: { status: 'PUBLISHED', isDeleted: false } } } },
        recipes: {
          where: { status: 'PUBLISHED', isDeleted: false },
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: { author: true },
        },
      },
    });
    if (!category) return null;
    const totalCount = category._count.recipes;
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      imageUrl: category.imageUrl ?? undefined,
      orderIndex: category.orderIndex,
      recipeCount: totalCount,
      createdAt: category.createdAt,
      recipes: createPagedResult(category.recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty as import('../../domain/enums/RecipeDifficulty.js').RecipeDifficulty,
        status: recipe.status as import('../../domain/enums/RecipeStatus.js').RecipeStatus,
        categoryId: recipe.categoryId,
        categoryName: category.name,
        authorId: recipe.authorId,
        authorName: recipe.author.displayName,
        publishedAt: recipe.publishedAt ?? undefined,
        createdAt: recipe.createdAt,
      })), query.page, query.pageSize, totalCount),
    };
  }
}
