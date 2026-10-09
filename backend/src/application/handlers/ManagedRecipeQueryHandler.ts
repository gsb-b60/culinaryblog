import { type Prisma, type PrismaClient } from '@prisma/client';

import { type IQueryHandler } from '../command-bus.js';
import { createPagedResult, type PagedResult } from '../dtos/PagedResult.js';
import { type RecipeDto } from '../dtos/RecipeDto.js';
import { GetManagedRecipesQuery } from '../queries/recipes/GetManagedRecipesQuery.js';

import { recipeInclude, toRecipeDto } from './RecipeStatusCommandHandlers.js';

export class ManagedRecipeQueryHandler implements IQueryHandler<GetManagedRecipesQuery, PagedResult<RecipeDto>> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetManagedRecipesQuery): Promise<PagedResult<RecipeDto>> {
    const where: Prisma.RecipeWhereInput = {
      isDeleted: false,
      ...(!query.isAdmin ? { authorId: query.userId } : {}),
    };
    const [recipes, count] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        include: recipeInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.recipe.count({ where }),
    ]);
    return createPagedResult(recipes.map(toRecipeDto), query.page, query.pageSize, count);
  }
}
