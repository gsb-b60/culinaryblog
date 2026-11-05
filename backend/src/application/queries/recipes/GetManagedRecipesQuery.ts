import { Query } from '../../command-bus.js';
import { type PagedResult } from '../../dtos/PagedResult.js';
import { type RecipeDto } from '../../dtos/RecipeDto.js';

export class GetManagedRecipesQuery extends Query<PagedResult<RecipeDto>> {
  readonly type = 'GetManagedRecipesQuery';

  constructor(
    public readonly userId: string,
    public readonly isAdmin = false,
    public readonly page = 1,
    public readonly pageSize = 12,
  ) {
    super();
  }
}
