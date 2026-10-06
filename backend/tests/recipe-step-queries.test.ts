import { describe, expect, it, vi } from 'vitest';

import {
  GetManagedRecipesQuery,
  GetManagedRecipesQueryHandler,
  GetRecipeStepsQuery,
  GetRecipeStepsQueryHandler,
} from '../src/application/handlers/RecipeStepQueryHandlers.js';

function mockPrisma() {
  return {
    recipe: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'recipe-1',
        title: 'Canh rau',
        authorId: 'owner',
        status: 'DRAFT',
        steps: [
          {
            id: 'step-1',
            stepNumber: 1,
            title: 'Wash',
            description: 'Wash well',
            timerMinutes: 0,
            imageUrl: null,
          },
        ],
      }),
    },
  };
}
describe('Step management read queries', () => {
  it('limits author recipe choices to their own undeleted recipes', async () => {
    const prisma = mockPrisma();
    await new GetManagedRecipesQueryHandler(prisma as never).execute(
      new GetManagedRecipesQuery('owner', false),
    );
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDeleted: false, authorId: 'owner' } }),
    );
  });
  it('allows Admin to list recipes of all authors', async () => {
    const prisma = mockPrisma();
    await new GetManagedRecipesQueryHandler(prisma as never).execute(
      new GetManagedRecipesQuery('admin', true),
    );
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDeleted: false } }),
    );
  });
  it('reads ordered, undeleted steps and preserves a zero timer', async () => {
    const prisma = mockPrisma();
    const result = await new GetRecipeStepsQueryHandler(prisma as never).execute(
      new GetRecipeStepsQuery('recipe-1', 'owner', false),
    );
    expect(result.steps[0]).toMatchObject({ timerMinutes: 0, imageUrl: undefined });
    expect(prisma.recipe.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'recipe-1', isDeleted: false },
        select: expect.objectContaining({
          steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
        }),
      }),
    );
  });
  it('returns 403 for a different author', async () => {
    await expect(
      new GetRecipeStepsQueryHandler(mockPrisma() as never).execute(
        new GetRecipeStepsQuery('recipe-1', 'other', false),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
  it('allows Admin to read another author’s recipe steps', async () => {
    const result = await new GetRecipeStepsQueryHandler(mockPrisma() as never).execute(
      new GetRecipeStepsQuery('recipe-1', 'admin', true),
    );
    expect(result.recipe.id).toBe('recipe-1');
  });
  it('returns 404 for a missing recipe', async () => {
    const prisma = mockPrisma();
    prisma.recipe.findUnique.mockResolvedValue(null);
    await expect(
      new GetRecipeStepsQueryHandler(prisma as never).execute(
        new GetRecipeStepsQuery('missing', 'owner', false),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
