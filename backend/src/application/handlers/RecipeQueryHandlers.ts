import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';
import { IRecipeRepository } from '../../domain/repositories/IRecipeRepository.js';
import { IQueryHandler } from '../command-bus.js';
import { PagedResult } from '../dtos/PagedResult.js';
import { RecipeSummaryDto } from '../dtos/RecipeDto.js';
import { GetRecipesQuery } from '../queries/recipes/RecipeQueries.js';

export class GetRecipesQueryHandler
implements IQueryHandler<GetRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  execute(query: GetRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    return this.recipeRepository.findMany(
      { ...query.filters, status: RecipeStatus.PUBLISHED },
      query.sort,
      query.page,
      query.pageSize,
    );
  }
}
