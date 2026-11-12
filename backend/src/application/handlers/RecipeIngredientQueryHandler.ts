import { type PrismaClient } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { Query, type IQueryHandler } from '../command-bus.js';
import { type RecipeIngredientDto } from '../dtos/RecipeDto.js';

export class GetRecipeIngredientsQuery extends Query<RecipeIngredientDto[]> {
  readonly type = 'GetRecipeIngredientsQuery';

  /** Capture query parameters or the Prisma dependency without performing I/O. */
  constructor(
    public readonly recipeId: string,
    public readonly userId: string,
    public readonly isAdmin: boolean,
  ) {
    super();
  }
}

export class GetRecipeIngredientsQueryHandler implements IQueryHandler<
  GetRecipeIngredientsQuery,
  RecipeIngredientDto[]
> {
  /** Capture query parameters or the Prisma dependency without performing I/O. */
  constructor(private readonly prisma: PrismaClient) {}

  /** Verify recipe existence and owner/Admin access, then return active ingredients in stable display order. */
  async execute(query: GetRecipeIngredientsQuery): Promise<RecipeIngredientDto[]> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: query.recipeId, isDeleted: false },
      select: { authorId: true },
    });
    if (!recipe) throw new NotFoundError('Recipe');
    if (!query.isAdmin && recipe.authorId !== query.userId) {
      throw new ForbiddenError('You are not allowed to manage this recipe');
    }
    const ingredients = await this.prisma.recipeIngredient.findMany({
      where: { recipeId: query.recipeId, isDeleted: false },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity === null ? undefined : Number(ingredient.quantity),
      unit: ingredient.unit ?? undefined,
      notes: ingredient.notes ?? undefined,
      orderIndex: ingredient.orderIndex,
    }));
  }
}
