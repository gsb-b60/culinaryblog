import { describe, expect, it } from 'vitest'
import { parseRecipeFilters } from '../lib/recipeFilters'

describe('parseRecipeFilters', () => {
  it('normalizes shared links and accepts a zero cook time', () => {
    const parsed = parseRecipeFilters(new URLSearchParams('difficulty=Easy&maxCookTime=0&minServings=2&page=3&pageSize=24'))
    expect(parsed.errors).toEqual({})
    expect(parsed.query).toEqual({ difficulty: 'EASY', maxCookTime: 0, minServings: 2, page: 3, pageSize: 24 })
  })

  it.each([
    ['difficulty=unknown', 'difficulty'],
    ['categoryId=invalid', 'categoryId'],
    ['maxCookTime=-1', 'maxCookTime'],
    ['maxCookTime=1.5', 'maxCookTime'],
    ['maxCookTime=2147483648', 'maxCookTime'],
    ['minServings=0', 'minServings'],
    ['page=0', 'page'],
    ['pageSize=51', 'pageSize'],
    ['difficulty=Easy&difficulty=Hard', 'difficulty'],
  ])('rejects %s', (query, field) => {
    expect(parseRecipeFilters(new URLSearchParams(query)).errors).toHaveProperty(field)
  })
})
