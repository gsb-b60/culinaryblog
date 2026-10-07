import { PrismaClient } from '@prisma/client';
import { UserRole } from '../../domain/enums/UserRole.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';
import { RecipeDifficulty } from '../../domain/enums/RecipeDifficulty.js';
import { RecipeRepository } from '../../infrastructure/persistence/repositories/RecipeRepository.js';
import { IQueryHandler } from '../command-bus.js';
import { PagedResult } from '../dtos/PagedResult.js';
import { RecipeDetailDto, RecipeSummaryDto } from '../dtos/RecipeDto.js';
import {
  GetRecipesQuery, SearchRecipesQuery, GetManageableRecipesQuery, GetRecipeBySlugQuery,
} from '../queries/recipes/RecipeQueries.js';

// Repository currently returns summary objects with a domain-entity return type.
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

export class GetManageableRecipesQueryHandler implements IQueryHandler<GetManageableRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly repository: RecipeRepository) {}
  async execute(query: GetManageableRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    const filters = query.isAdmin ? query.filters : { ...query.filters, authorId: query.userId };
    return await this.repository.findMany(
      filters, query.sort, query.page, query.pageSize,
    ) as unknown as PagedResult<RecipeSummaryDto>;
  }
}

export class GetRecipeBySlugQueryHandler implements IQueryHandler<GetRecipeBySlugQuery, RecipeDetailDto | null> {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(query: GetRecipeBySlugQuery): Promise<RecipeDetailDto | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug: query.slug, isDeleted: false },
      include: {
        author: { select: { displayName: true } },
        category: { select: { name: true } },
        steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
        ingredients: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
        images: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!recipe || (recipe.status !== 'PUBLISHED' &&
      recipe.authorId !== query.userId && query.userRole !== UserRole.ADMIN)) return null;
    return {
      id: recipe.id, title: recipe.title, slug: recipe.slug, description: recipe.description,
      prepTime: recipe.prepTime, cookTime: recipe.cookTime, servings: recipe.servings,
      difficulty: recipe.difficulty as RecipeDifficulty, status: recipe.status as RecipeStatus,
      categoryId: recipe.categoryId, categoryName: recipe.category.name,
      authorId: recipe.authorId, authorName: recipe.author.displayName,
      publishedAt: recipe.publishedAt ?? undefined, createdAt: recipe.createdAt,
      instructions: recipe.instructions ?? undefined,
      nutrition: {
        calories: recipe.nutritionCalories == null ? undefined : Number(recipe.nutritionCalories),
        protein: recipe.nutritionProtein == null ? undefined : Number(recipe.nutritionProtein),
        carbohydrates: recipe.nutritionCarbohydrates == null ? undefined : Number(recipe.nutritionCarbohydrates),
        fat: recipe.nutritionFat == null ? undefined : Number(recipe.nutritionFat),
        fiber: recipe.nutritionFiber == null ? undefined : Number(recipe.nutritionFiber),
        sodium: recipe.nutritionSodium == null ? undefined : Number(recipe.nutritionSodium),
      },
      steps: recipe.steps.map(step => ({
        id: step.id, stepNumber: step.stepNumber, title: step.title, description: step.description,
        timerMinutes: step.timerMinutes ?? undefined, imageUrl: step.imageUrl ?? undefined,
      })),
      ingredients: recipe.ingredients.map(ingredient => ({
        id: ingredient.id, name: ingredient.name,
        quantity: ingredient.quantity == null ? undefined : Number(ingredient.quantity),
        unit: ingredient.unit ?? undefined, notes: ingredient.notes ?? undefined, orderIndex: ingredient.orderIndex,
      })),
      images: recipe.images.map(image => ({
        id: image.id, originalUrl: image.originalUrl, mediumUrl: image.mediumUrl ?? undefined,
        thumbnailUrl: image.thumbnailUrl ?? undefined, altText: image.altText ?? undefined,
        isPrimary: image.isPrimary, orderIndex: image.orderIndex,
      })),
    };
  }
}
