import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { RecipeDifficulty } from '../../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';
import type { IRecipeRepository } from '../../domain/repositories/IRecipeRepository.js';
import type { IQueryHandler } from '../command-bus.js';
import { createPagedResult, type PagedResult } from '../dtos/PagedResult.js';
import type { RecipeIngredientDto, RecipeSummaryDto } from '../dtos/RecipeDto.js';
import {
  GetManageableRecipesQuery,
  GetRecipeIngredientsQuery,
  GetRecipesQuery,
} from '../queries/recipes/RecipeQueries.js';

export class GetRecipesQueryHandler
  implements IQueryHandler<GetRecipesQuery, PagedResult<RecipeSummaryDto>>
{
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  execute(query: GetRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    return this.recipeRepository.findMany(
      query.filters,
      query.sort,
      query.page,
      query.pageSize,
    );
  }
}

export class GetRecipeIngredientsQueryHandler
  implements IQueryHandler<GetRecipeIngredientsQuery, RecipeIngredientDto[]>
{
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetRecipeIngredientsQuery): Promise<RecipeIngredientDto[]> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: query.recipeId, isDeleted: false },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundError('Recipe');

    const ingredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: query.recipeId, isDeleted: false },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });

    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity === null ? undefined : Number(ingredient.quantity),
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      orderIndex: ingredient.orderIndex,
    }));
  }
}

export class GetManageableRecipesQueryHandler
  implements IQueryHandler<GetManageableRecipesQuery, PagedResult<RecipeSummaryDto>>
{
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetManageableRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    const where = {
      isDeleted: false,
      ...(query.isAdmin ? {} : { authorId: query.userId }),
    };
    const [recipes, totalCount] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          author: { select: { displayName: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const items: RecipeSummaryDto[] = recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: RecipeDifficulty[recipe.difficulty],
      status: RecipeStatus[recipe.status],
      categoryId: recipe.categoryId,
      categoryName: recipe.category.name,
      authorId: recipe.authorId,
      authorName: recipe.author.displayName,
      publishedAt: recipe.publishedAt ?? undefined,
      createdAt: recipe.createdAt,
    }));

    return createPagedResult(items, query.page, query.pageSize, totalCount);
  }
}
