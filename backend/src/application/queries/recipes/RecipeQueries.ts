import { Query } from '../command-bus.js';
import { RecipeFilters, RecipeSortOptions } from '../../domain/repositories/IRecipeRepository.js';

export class GetRecipesQuery extends Query<import('../dtos/PagedResult.js').PagedResult<import('../dtos/RecipeDto.js').RecipeSummaryDto>> {
  readonly type = 'GetRecipesQuery';

  constructor(
    public readonly filters: RecipeFilters,
    public readonly sort: RecipeSortOptions,
    public readonly page: number,
    public readonly pageSize: number
  ) {
    super();
  }
}

export class GetRecipeBySlugQuery extends Query<import('../dtos/RecipeDto.js').RecipeDetailDto | null> {
  readonly type = 'GetRecipeBySlugQuery';

  constructor(
    public readonly slug: string,
    public readonly userId?: string,
    public readonly userRole?: string
  ) {
    super();
  }
}

export class SearchRecipesQuery extends Query<import('../dtos/PagedResult.js').PagedResult<import('../dtos/RecipeDto.js').RecipeSummaryDto>> {
  readonly type = 'SearchRecipesQuery';

  constructor(
    public readonly query: string,
    public readonly filters: RecipeFilters,
    public readonly sort: RecipeSortOptions,
    public readonly page: number,
    public readonly pageSize: number
  ) {
    super();
  }
}