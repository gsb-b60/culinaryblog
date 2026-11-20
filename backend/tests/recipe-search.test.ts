import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { SearchRecipesQueryHandler } from '../src/application/handlers/RecipeQueryHandlers.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import recipeRoutes from '../src/presentation/routes/recipeRoutes.js';
import {
  buildPrefixTsQuery,
  RecipeRepository,
} from '../src/infrastructure/persistence/repositories/RecipeRepository.js';

const prisma = { $queryRaw: vi.fn() };
const app = express();
app.use('/api/v1/recipes', recipeRoutes);
app.use(globalErrorHandler);

const row = {
  id: 'r1',
  title: 'Phở bò tái nạm',
  slug: 'pho-bo-tai-nam',
  description: 'Nước dùng thơm, thịt bò mềm.',
  prepTime: 20,
  cookTime: 45,
  servings: 2,
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  categoryId: 'c1',
  authorId: 'a1',
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  authorName: 'Chef Nguyễn',
  categoryName: 'Món nước',
  relevanceScore: 0.87,
};

function firstSql() {
  return prisma.$queryRaw.mock.calls[0]?.[0] as { sql: string; values: unknown[] } | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  const repository = new RecipeRepository(prisma as never);
  commandBus.registerQueryHandler('SearchRecipesQuery', new SearchRecipesQueryHandler(repository));
});

describe('FR-SRCH-001 full-text search', () => {
  it.each([
    ['phở bò', 'pho:* & bo:*'],
    ['PHO BO', 'pho:* & bo:*'],
    ['pho', 'pho:*'],
    ['phở, bò!', 'pho:* & bo:*'],
  ])('normalises %s into safe prefix terms', (input, expected) => {
    expect(buildPrefixTsQuery(input)).toBe(expected);
  });

  it('returns ranked published matches with relevanceScore', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    const response = await request(app).get('/api/v1/recipes/search?q=pho');

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({
      id: 'r1',
      title: 'Phở bò tái nạm',
      authorName: 'Chef Nguyễn',
      categoryName: 'Món nước',
      relevanceScore: 0.87,
    });
    expect(response.body.meta.totalCount).toBe(1);
    expect(firstSql()?.values).toEqual(
      expect.arrayContaining(['pho:*', 'PUBLISHED']),
    );
    expect(firstSql()?.sql).toContain('to_tsquery');
    expect(firstSql()?.sql).toContain('ts_rank');
    expect(firstSql()?.sql).toContain('relevanceScore');
  });

  it('combines search with filters and explicit field sorting', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ count: BigInt(0) }]);

    const response = await request(app).get(
      '/api/v1/recipes/search?q=pho&difficulty=Hard&maxCookTime=30&minServings=2&sort=-cookTime',
    );

    expect(response.status).toBe(200);
    expect(firstSql()?.values).toEqual(
      expect.arrayContaining(['pho:*', 'PUBLISHED', 'HARD', 30, 2]),
    );
    expect(firstSql()?.sql).toContain('cook_time');
    expect(firstSql()?.sql).toContain('DESC');
  });

  it.each(['/?q=a', '/?q=%20%20', '/?q='])('rejects a too-short query %s', async (path) => {
    const response = await request(app).get('/api/v1/recipes/search' + path);
    expect(response.status).toBe(422);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns an empty page when the query has no searchable terms', async () => {
    const response = await request(app).get('/api/v1/recipes/search?q=!!!');

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.meta.totalCount).toBe(0);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
