import { type Prisma, type PrismaClient } from '@prisma/client';
import { type IQueryHandler } from '../command-bus.js';
import { GetRecipeOverviewQuery, type RecipeOverview } from '../queries/recipes/GetRecipeOverviewQuery.js';
import { recipeInclude, toRecipeDto } from './RecipeStatusCommandHandlers.js';

/** Aggregate only the recipes this account can manage; never accept scope from the client. */
export class RecipeOverviewQueryHandler implements IQueryHandler<GetRecipeOverviewQuery, RecipeOverview> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetRecipeOverviewQuery): Promise<RecipeOverview> {
    const where: Prisma.RecipeWhereInput = {
      isDeleted: false,
      ...(!query.isAdmin ? { authorId: query.userId } : {}),
    };
    const grouped = this.prisma.recipe.groupBy({
      by: ['status'], where, _count: { _all: true }, orderBy: { status: 'asc' },
    });
    const [groups, recent] = await this.prisma.$transaction([
      grouped,
      this.prisma.recipe.findMany({
        where, include: recipeInclude,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: 5,
      }),
    ], { isolationLevel: 'RepeatableRead' });
    const count = (status: string) => groups.find(group => group.status === status)?._count._all ?? 0;
    return {
      stats: {
        total: groups.reduce((sum, group) => sum + group._count._all, 0),
        published: count('PUBLISHED'), draft: count('DRAFT'), archived: count('ARCHIVED'),
      },
      recentRecipes: recent.map(toRecipeDto),
    };
  }
}
