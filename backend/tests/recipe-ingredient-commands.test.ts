import { describe, expect, it, vi } from 'vitest';

import {
  AddRecipeIngredientCommand,
  UpdateRecipeIngredientCommand,
  DeleteRecipeIngredientCommand,
} from '../src/application/commands/recipes/RecipeCommands.js';
import {
  AddRecipeIngredientCommandHandler,
  UpdateRecipeIngredientCommandHandler,
  DeleteRecipeIngredientCommandHandler,
} from '../src/application/handlers/RecipeIngredientCommandHandlers.js';

describe('Recipe ingredient command handlers', () => {
  it('adds an ingredient and returns the ingredient dto', async () => {
    const prisma = {
      recipe: {
        findUnique: vi.fn().mockResolvedValue({ id: 'recipe-1', authorId: 'user-1' }),
      },
      recipeIngredient: {
        create: vi.fn().mockResolvedValue({
          id: 'ingredient-1',
          recipeId: 'recipe-1',
          name: 'Carrot',
          quantity: 2.5,
          unit: 'kg',
          notes: 'Fresh',
          orderIndex: 2,
        }),
      },
    } as any;

    const handler = new AddRecipeIngredientCommandHandler(prisma);
    const result = await handler.execute(
      new AddRecipeIngredientCommand('recipe-1', 'user-1', 'Carrot', 2.5, 'kg', 'Fresh', 2)
    );

    expect(result).toEqual({
      id: 'ingredient-1',
      name: 'Carrot',
      quantity: 2.5,
      unit: 'kg',
      notes: 'Fresh',
      orderIndex: 2,
    });
  });

  it('updates an ingredient and returns the updated dto', async () => {
    const prisma = {
      recipe: {
        findUnique: vi.fn().mockResolvedValue({ id: 'recipe-1', authorId: 'user-1' }),
      },
      recipeIngredient: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ingredient-1',
          recipeId: 'recipe-1',
          name: 'Carrot',
          quantity: 2.5,
          unit: 'kg',
          notes: 'Fresh',
          orderIndex: 2,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'ingredient-1',
          recipeId: 'recipe-1',
          name: 'Carrot',
          quantity: 3,
          unit: 'kg',
          notes: 'Freshly cut',
          orderIndex: 1,
        }),
      },
    } as any;

    const handler = new UpdateRecipeIngredientCommandHandler(prisma);
    const result = await handler.execute(
      new UpdateRecipeIngredientCommand('recipe-1', 'user-1', 'ingredient-1', 'Carrot', 3, 'kg', 'Freshly cut', 1)
    );

    expect(result).toEqual({
      id: 'ingredient-1',
      name: 'Carrot',
      quantity: 3,
      unit: 'kg',
      notes: 'Freshly cut',
      orderIndex: 1,
    });
  });

  it('deletes an ingredient when it belongs to the recipe owner', async () => {
    const prisma = {
      recipe: {
        findUnique: vi.fn().mockResolvedValue({ id: 'recipe-1', authorId: 'user-1' }),
      },
      recipeIngredient: {
        findFirst: vi.fn().mockResolvedValue({ id: 'ingredient-1', recipeId: 'recipe-1' }),
        update: vi.fn().mockResolvedValue({ id: 'ingredient-1' }),
      },
    } as any;

    const handler = new DeleteRecipeIngredientCommandHandler(prisma);
    await expect(
      handler.execute(new DeleteRecipeIngredientCommand('recipe-1', 'user-1', 'ingredient-1'))
    ).resolves.toBeUndefined();

    expect(prisma.recipeIngredient.update).toHaveBeenCalledWith({
      where: { id: 'ingredient-1' },
      data: { isDeleted: true },
    });
  });
});
