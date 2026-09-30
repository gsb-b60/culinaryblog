import { IQueryHandler } from '../../command-bus.js';
import { RecipeSummaryDto } from '../../dtos/RecipeDto.js';
import { PagedResult } from '../../dtos/PagedResult.js';
import { GetRecipesQuery } from './RecipeQueries.js';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository.js';

export class GetRecipesQueryHandler implements IQueryHandler<GetRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  async execute(query: GetRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    const result = await this.recipeRepository.findMany(
      {
        ...query.filters,
        visibility: { role: query.userRole, userId: query.userId },
      },
      query.sort,
      query.page,
      query.pageSize,
    );

    return {
      ...result,
      items: result.items.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug.getValue(),
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        status: recipe.status,
        categoryId: recipe.categoryId,
        categoryName: (recipe as any)._categoryName ?? recipe.categoryId,
        authorId: recipe.authorId,
        authorName: (recipe as any)._authorName ?? recipe.authorId,
        publishedAt: recipe.publishedAt,
        createdAt: recipe.createdAt,
      })),
    };
  }
}
