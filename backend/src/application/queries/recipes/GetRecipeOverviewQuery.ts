import { Query } from '../../command-bus.js';
import { type RecipeDto } from '../../dtos/RecipeDto.js';

export interface RecipeOverview {
  stats: { total: number; published: number; draft: number; archived: number };
  recentRecipes: RecipeDto[];
}

export class GetRecipeOverviewQuery extends Query<RecipeOverview> {
  readonly type = 'GetRecipeOverviewQuery';

  constructor(public readonly userId: string, public readonly isAdmin: boolean) { super(); }
}
