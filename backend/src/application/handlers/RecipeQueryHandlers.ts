import { type PrismaClient } from '@prisma/client';

import { ForbiddenError } from '../../config-middleware/shared/errors/AppError.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';
import { UserRole } from '../../domain/enums/UserRole.js';
import { type CategoryRepository } from '../../infrastructure/persistence/repositories/CategoryRepository.js';
import { type RecipeRepository } from '../../infrastructure/persistence/repositories/RecipeRepository.js';
import { type IQueryHandler } from '../command-bus.js';
import { type CategoryDetailDto, type CategoryDto } from '../dtos/CategoryDto.js';
import { type PagedResult } from '../dtos/PagedResult.js';
import { type RecipeSummaryDto, type RecipeDetailDto } from '../dtos/RecipeDto.js';
import { GetCategoriesQuery, GetCategoryBySlugQuery } from '../queries/categories/CategoryQueries.js';
import { GetRecipesQuery, SearchRecipesQuery, GetRecipeBySlugQuery } from '../queries/recipes/RecipeQueries.js';

import { recipeInclude, toRecipeDto } from './RecipeStatusCommandHandlers.js';

// Repositories currently return summary DTOs with a domain-entity return type.
export class GetRecipesQueryHandler implements IQueryHandler<GetRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly repository: RecipeRepository) {}

  async execute(query: GetRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    return await this.repository.findMany(
      { ...query.filters, status: RecipeStatus.PUBLISHED }, query.sort, query.page, query.pageSize,
    ) as unknown as PagedResult<RecipeSummaryDto>;
  }
}

export class SearchRecipesQueryHandler implements IQueryHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly repository: RecipeRepository) {}

  async execute(query: SearchRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    return await this.repository.search(
      query.query, { ...query.filters, status: RecipeStatus.PUBLISHED }, query.sort, query.page, query.pageSize,
    ) as unknown as PagedResult<RecipeSummaryDto>;
  }
}

export class GetRecipeBySlugQueryHandler implements IQueryHandler<GetRecipeBySlugQuery, RecipeDetailDto | null> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetRecipeBySlugQuery): Promise<RecipeDetailDto | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug: query.slug, isDeleted: false }, include: recipeInclude,
    });
    if (!recipe) return null;
    if (recipe.status !== RecipeStatus.PUBLISHED && recipe.authorId !== query.userId && query.userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('You cannot view this private recipe');
    }
    return toRecipeDto(recipe);
  }
}

export class GetCategoriesQueryHandler implements IQueryHandler<GetCategoriesQuery, PagedResult<CategoryDto>> {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(query: GetCategoriesQuery): Promise<PagedResult<CategoryDto>> {
    return await this.repository.findMany(query.filters, query.page, query.pageSize) as unknown as PagedResult<CategoryDto>;
  }
}

export class GetCategoryBySlugQueryHandler implements IQueryHandler<GetCategoryBySlugQuery, CategoryDetailDto | null> {
  constructor(private readonly categories: CategoryRepository, private readonly recipes: RecipeRepository) {}

  async execute(query: GetCategoryBySlugQuery): Promise<CategoryDetailDto | null> {
    const category = await this.categories.findBySlug(query.slug);
    if (!category) return null;
    const recipes = await this.recipes.findPublishedByCategory(category.id, query.page, query.pageSize) as unknown as PagedResult<RecipeSummaryDto>;
    return {
      id: category.id, name: category.name, slug: category.slug.getValue(),
      description: category.description, imageUrl: category.imageUrl,
      orderIndex: category.orderIndex, createdAt: category.createdAt,
      recipeCount: recipes.meta.totalCount, recipes,
    };
  }
}
