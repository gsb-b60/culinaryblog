import { describe, expect, it } from 'vitest';
import { recipeFiltersSchema } from '../src/application/validators/recipeValidators.js';

describe('FR-SRCH-002 filter validation', () => {
  it.each(['Easy', 'Medium', 'Hard', 'Expert', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'])(
    'normalizes %s for Prisma', difficulty => {
      expect(recipeFiltersSchema.parse({ difficulty }).difficulty).toBe(difficulty.toUpperCase());
    },
  );
  it('keeps inclusive zero cookTime and positive servings', () => {
    expect(recipeFiltersSchema.parse({ maxCookTime: '0', minServings: '2' }))
      .toEqual({ maxCookTime: 0, minServings: 2 });
  });
  it.each([
    { difficulty: 'Impossible' }, { difficulty: ['Easy', 'Hard'] },
    { maxCookTime: '' }, { maxCookTime: '-1' }, { maxCookTime: '0.5' },
    { maxCookTime: '2147483648' }, { minServings: '0' }, { minServings: '-1' },
    { minServings: '1.2' }, { minServings: 'abc' }, { minServings: '' },
    { minServings: ['2', '3'] }, { minServings: '2147483648' }, { categoryId: 'invalid' },
  ])('rejects malformed filters %j', query => {
    expect(recipeFiltersSchema.safeParse(query).success).toBe(false);
  });
});
