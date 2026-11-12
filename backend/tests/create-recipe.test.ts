import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { CreateRecipeCommand } from '../src/application/commands/recipes/RecipeCommands.js';
import { CreateRecipeCommandHandler } from '../src/application/handlers/CreateRecipeCommandHandler.js';
import { RecipeDifficulty } from '../src/domain/enums/RecipeDifficulty.js';

const category = { id: 'category-1', name: 'Món Việt' };
const savedRecipe = {
  id: 'recipe-1',
  title: 'Phở bò Hà Nội',
  slug: 'pho-bo-ha-noi',
  description: 'Món phở truyền thống thơm ngon.',
  instructions: 'Nấu nước dùng và hoàn thiện món ăn.',
  prepTime: 20,
  cookTime: 120,
  servings: 4,
  difficulty: 'EASY',
  status: 'DRAFT',
  categoryId: 'category-1',
  authorId: 'author-1',
  publishedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  version: 1,
  nutritionCalories: new Prisma.Decimal(450),
  nutritionProtein: null,
  nutritionCarbohydrates: null,
  nutritionFat: null,
  nutritionFiber: null,
  nutritionSodium: null,
  author: { displayName: 'Author' },
  category,
  steps: [{ id: 'step-1', stepNumber: 1, title: 'Nấu nước dùng', description: 'Ninh xương.', timerMinutes: 120, imageUrl: null }],
  ingredients: [{ id: 'ingredient-1', name: 'Bánh phở', quantity: new Prisma.Decimal('0.5'), unit: 'kg', notes: null, orderIndex: 0 }],
  images: [],
};

function input() {
  return {
    title: 'Phở bò Hà Nội',
    description: 'Món phở truyền thống thơm ngon.',
    categoryId: category.id,
    prepTime: 20,
    cookTime: 120,
    servings: 4,
    difficulty: RecipeDifficulty.EASY,
    instructions: 'Nấu nước dùng và hoàn thiện món ăn.',
    nutrition: { calories: 450 },
    steps: [{ stepNumber: 1, title: 'Nấu nước dùng', description: 'Ninh xương.', timerMinutes: 120 }],
    ingredients: [{ name: 'Bánh phở', quantity: 0.5, unit: 'kg', orderIndex: 0 }],
  };
}

function prismaMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    recipe: {
      create: vi.fn().mockResolvedValue(savedRecipe),
    },
  };
  return {
    category: { findUnique: vi.fn().mockResolvedValue(category) },
    recipe: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    ...overrides,
  } as any;
}

describe('CreateRecipeCommandHandler', () => {
  it('creates the complete recipe atomically, keeps it as draft, returns the DTO, and invalidates cache', async () => {
    const prisma = prismaMock();
    const invalidateCache = vi.fn().mockResolvedValue(undefined);
    const handler = new CreateRecipeCommandHandler(prisma, invalidateCache);

    const result = await handler.execute(new CreateRecipeCommand('author-1', input()));

    expect(result).toMatchObject({ id: 'recipe-1', slug: 'pho-bo-ha-noi', status: 'DRAFT', categoryName: 'Món Việt' });
    expect(result.steps).toHaveLength(1);
    expect(result.ingredients).toHaveLength(1);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(invalidateCache).toHaveBeenCalledOnce();
    expect(prisma.recipe.findUnique).toHaveBeenCalledWith({ where: { slug: 'pho-bo-ha-noi' }, select: { id: true } });
  });

  it('rejects a missing category before starting a transaction', async () => {
    const prisma = prismaMock({ category: { findUnique: vi.fn().mockResolvedValue(null) } });
    const handler = new CreateRecipeCommandHandler(prisma);

    await expect(handler.execute(new CreateRecipeCommand('author-1', input()))).rejects.toMatchObject({ statusCode: 422 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a duplicate generated slug before writing', async () => {
    const prisma = prismaMock({ recipe: { findUnique: vi.fn().mockResolvedValue({ id: 'existing' }) } });
    const handler = new CreateRecipeCommandHandler(prisma);

    await expect(handler.execute(new CreateRecipeCommand('author-1', input()))).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique violation to conflict', async () => {
    const prisma = prismaMock();
    prisma.$transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5.17.0' }));
    const handler = new CreateRecipeCommandHandler(prisma);

    await expect(handler.execute(new CreateRecipeCommand('author-1', input()))).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a title that normalizes to an empty slug', async () => {
    const prisma = prismaMock();
    const handler = new CreateRecipeCommandHandler(prisma);

    await expect(handler.execute(new CreateRecipeCommand('author-1', { ...input(), title: '-----' }))).rejects.toMatchObject({ statusCode: 422 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not invalidate cache when the transaction rolls back', async () => {
    const prisma = prismaMock();
    prisma.$transaction.mockRejectedValue(new Error('nested write failed'));
    const invalidateCache = vi.fn().mockResolvedValue(undefined);
    const handler = new CreateRecipeCommandHandler(prisma, invalidateCache);

    await expect(handler.execute(new CreateRecipeCommand('author-1', input()))).rejects.toThrow('nested write failed');
    expect(invalidateCache).not.toHaveBeenCalled();
  });
});
