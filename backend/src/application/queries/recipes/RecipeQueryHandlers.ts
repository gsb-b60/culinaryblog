import { IQueryHandler } from '../../command-bus.js';
import { RecipeSummaryDto } from '../../dtos/RecipeDto.js';
import { PagedResult } from '../../dtos/PagedResult.js';
import { GetRecipesQuery } from './RecipeQueries.js';
import { IRecipeRepository } from '../../../domain/repositories/IRecipeRepository.js';

export class GetRecipesQueryHandler implements IQueryHandler<GetRecipesQuery, PagedResult<RecipeSummaryDto>> {
  constructor(private readonly recipeRepository: IRecipeRepository) {}

  execute(query: GetRecipesQuery): Promise<PagedResult<RecipeSummaryDto>> {
    return this.recipeRepository.findMany(
      {
        ...query.filters,
        visibility: { role: query.userRole, userId: query.userId },
      },
      query.sort,
      query.page,
      query.pageSize,
    ) as Promise<PagedResult<RecipeSummaryDto>>;
  }
}
