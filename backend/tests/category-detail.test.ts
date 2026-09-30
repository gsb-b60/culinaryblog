import { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { GetCategoryBySlugQuery } from '../src/application/queries/categories/CategoryQueries.js';
import { GetCategoryBySlugQueryHandler } from '../src/application/queries/categories/GetCategoryBySlugQueryHandler.js';

describe('GetCategoryBySlugQueryHandler', () => {
  it('returns published recipe summaries and pagination for a category', async () => {
    const categoryFindFirst = vi.fn().mockResolvedValue({
      id: 'category-1',
      name: 'Breakfast',
      slug: 'breakfast',
      description: null,
      _count: { recipes: 1 },
    });
    const recipeFindMany = vi.fn().mockResolvedValue([
      {
        id: 'recipe-1',
        title: 'Omelet',
        slug: 'omelet',
        description: 'A simple omelet',
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: 'EASY',
        status: 'PUBLISHED',
        categoryId: 'category-1',
        authorId: 'author-1',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2025-12-31T00:00:00.000Z'),
        author: { displayName: 'Chef' },
      },
    ]);
    const recipeCount = vi.fn().mockResolvedValue(1);
    const prisma = {
      category: { findFirst: categoryFindFirst },
      recipe: { findMany: recipeFindMany, count: recipeCount },
    } as unknown as PrismaClient;
    const handler = new GetCategoryBySlugQueryHandler(prisma);

    const result = await handler.execute(new GetCategoryBySlugQuery('breakfast', 1, 12));

    expect(result).toMatchObject({
      id: 'category-1',
      name: 'Breakfast',
      recipeCount: 1,
      recipes: {
        items: [{ title: 'Omelet', categoryName: 'Breakfast', authorName: 'Chef' }],
        meta: { page: 1, pageSize: 12, totalCount: 1, totalPages: 1 },
      },
    });
    expect(recipeFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { categoryId: 'category-1', status: 'PUBLISHED', isDeleted: false },
      skip: 0,
      take: 12,
    }));
  });

  it('returns null when the category does not exist', async () => {
    const categoryFindFirst = vi.fn().mockResolvedValue(null);
    const prisma = {
      category: { findFirst: categoryFindFirst },
      recipe: { findMany: vi.fn(), count: vi.fn() },
    } as unknown as PrismaClient;
    const handler = new GetCategoryBySlugQueryHandler(prisma);

    await expect(handler.execute(new GetCategoryBySlugQuery('missing'))).resolves.toBeNull();
  });
});