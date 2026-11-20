import { RecipeFilters, RecipeSortOptions } from '../../../domain/repositories/IRecipeRepository.js';
import { ICacheable, Query } from '../../command-bus.js';

export class GetRecipesQuery extends Query<import('../../dtos/PagedResult.js').PagedResult<import('../../dtos/RecipeDto.js').RecipeSummaryDto>> implements ICacheable {
  readonly type = 'GetRecipesQuery';

  constructor(
    public readonly filters: RecipeFilters,
    public readonly sort: RecipeSortOptions,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly viewerId?: string,
    public readonly viewerRole?: 'AUTHOR' | 'ADMIN',
  ) {
    super();
  }

  getCacheKey(): string {
    return `recipes:list:${JSON.stringify({ filters: this.filters, sort: this.sort, page: this.page, pageSize: this.pageSize, viewerId: this.viewerId, viewerRole: this.viewerRole })}`;
  }

  getCacheTtl(): number { return 900; }
}

export class GetRecipeBySlugQuery extends Query<import('../../dtos/RecipeDto.js').RecipeDetailDto | null> implements ICacheable {
  readonly type = 'GetRecipeBySlugQuery';

  constructor(
    public readonly slug: string,
    public readonly userId?: string,
    public readonly userRole?: string
  ) {
    super();
  }

  getCacheKey(): string { return `recipes:detail:${this.slug}:${this.userId ?? 'guest'}:${this.userRole ?? 'guest'}`; }
  getCacheTtl(): number { return 3600; }
}

export class SearchRecipesQuery extends Query<import('../../dtos/PagedResult.js').PagedResult<import('../../dtos/RecipeDto.js').RecipeSummaryDto>> {
  readonly type = 'SearchRecipesQuery';

  constructor(
    public readonly query: string,
    public readonly filters: RecipeFilters,
    /** When omitted, results are ordered by text-search relevance. */
    public readonly sort: RecipeSortOptions | undefined,
    public readonly page: number,
    public readonly pageSize: number
  ) {
    super();
  }
}