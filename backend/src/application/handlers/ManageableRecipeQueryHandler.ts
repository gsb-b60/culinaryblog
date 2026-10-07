import { PrismaClient } from '@prisma/client';

import { Query, IQueryHandler } from '../command-bus.js';
import { createPagedResult, PagedResult } from '../dtos/PagedResult.js';

interface ManagedRecipe {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorId: string;
  authorName: string;
}

export class GetManageableRecipesQuery extends Query<PagedResult<ManagedRecipe>> {
  readonly type = 'GetManageableRecipesQuery';

  constructor(
    public readonly userId: string,
    public readonly isAdmin: boolean,
    public readonly page: number,
    public readonly pageSize: number,
  ) {
    super();
  }
}

export class GetManageableRecipesQueryHandler implements IQueryHandler<
  GetManageableRecipesQuery,
  PagedResult<ManagedRecipe>
> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetManageableRecipesQuery): Promise<PagedResult<ManagedRecipe>> {
    const where = { isDeleted: false, ...(query.isAdmin ? {} : { authorId: query.userId }) };
    const [recipes, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          authorId: true,
          author: { select: { displayName: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);
    return createPagedResult(
      recipes.map(({ author, ...recipe }) => ({
        ...recipe,
        authorName: author.displayName,
      })),
      query.page,
      query.pageSize,
      total,
    );
  }
}
