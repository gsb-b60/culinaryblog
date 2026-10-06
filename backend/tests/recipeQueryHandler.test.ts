import { describe, expect, it, vi } from 'vitest';

import {
  GetManageableRecipesQueryHandler,
  GetRecipeIngredientsQueryHandler,
  GetRecipesQueryHandler,
} from '../src/application/handlers/RecipeQueryHandlers.js';
import { GetManageableRecipesQuery, GetRecipeIngredientsQuery } from '../src/application/queries/recipes/RecipeQueries.js';
import { paginationSchema } from '../src/application/validators/recipeValidators.js';
import { RecipeDifficulty } from '../src/domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../src/domain/enums/RecipeStatus.js';
import type { IRecipeRepository } from '../src/domain/repositories/IRecipeRepository.js';
import { GetRecipesQuery } from '../src/application/queries/recipes/RecipeQueries.js';

describe('GetRecipesQueryHandler', () => {
  it('queries the repository and returns the paginated recipe summaries', async () => {
    const result = {
      items: [{
        id: 'recipe-1',
        title: 'Pho bo',
        slug: 'pho-bo',
        description: 'Traditional beef noodle soup',
        prepTime: 20,
        cookTime: 60,
        servings: 4,
        difficulty: RecipeDifficulty.MEDIUM,
        status: RecipeStatus.PUBLISHED,
        categoryId: 'category-1',
        authorId: 'author-1',
        createdAt: new Date('2026-10-05T00:00:00.000Z'),
      }],
      meta: {
        page: 1,
        pageSize: 5,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    const findMany = vi.fn().mockResolvedValue(result);
    const repository = { findMany } as unknown as IRecipeRepository;
    const handler = new GetRecipesQueryHandler(repository);
    const filters = { status: RecipeStatus.PUBLISHED };
    const sort = { field: 'createdAt' as const, order: 'desc' as const };

    await expect(handler.execute(new GetRecipesQuery(filters, sort, 1, 5))).resolves.toEqual(result);
    expect(findMany).toHaveBeenCalledWith(filters, sort, 1, 5);
  });
});

describe('paginationSchema', () => {
  it('converts URL query parameters to numbers', () => {
    expect(paginationSchema.parse({ page: '2', pageSize: '5' })).toEqual({
      page: 2,
      pageSize: 5,
    });
  });

  describe('GetRecipeIngredientsQueryHandler', () => {
    it('returns active ingredients in recipe order', async () => {
      const prisma = {
        recipe: { findFirst: vi.fn().mockResolvedValue({ id: 'recipe-1' }) },
        recipeIngredient: {
          findMany: vi.fn().mockResolvedValue([{
            id: 'ingredient-1',
            name: 'Flour',
            quantity: { toString: () => '2.5' },
            unit: 'cups',
            notes: null,
            orderIndex: 0,
          }]),
        },
      };
      const handler = new GetRecipeIngredientsQueryHandler(prisma as never);

      await expect(handler.execute(new GetRecipeIngredientsQuery('recipe-1'))).resolves.toEqual([{
        id: 'ingredient-1',
        name: 'Flour',
        quantity: 2.5,
        unit: 'cups',
        notes: undefined,
        orderIndex: 0,
      }]);
      expect(prisma.recipeIngredient.findMany).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1', isDeleted: false },
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('GetManageableRecipesQueryHandler', () => {
    it('limits recipe results to the requesting author', async () => {
      const prisma = {
        recipe: {
          findMany: vi.fn().mockResolvedValue([]),
          count: vi.fn().mockResolvedValue(0),
        },
      };
      const handler = new GetManageableRecipesQueryHandler(prisma as never);

      await handler.execute(new GetManageableRecipesQuery('author-1', false, 1, 50));

      expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false, authorId: 'author-1' },
        skip: 0,
        take: 50,
      }));
      expect(prisma.recipe.count).toHaveBeenCalledWith({
        where: { isDeleted: false, authorId: 'author-1' },
      });
    });
  });
});
