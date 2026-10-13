import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  archiveRecipe,
  createCategory,
  createRecipe,
  deleteCategory,
  deleteRecipe,
  getCategoryBySlug,
  getRecipeBySlug,
  listCategories,
  listRecipes,
  publishRecipe,
  searchRecipes,
} from '../lib/api'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('recipes api client (typed)', () => {
  it('lists recipes with query params and typed paged result', async () => {
    const paged = {
      items: [
        {
          id: 'r1',
          title: 'Pho Bo',
          slug: 'pho-bo',
          description: 'Vietnamese soup',
          prepTime: 15,
          cookTime: 60,
          servings: 4,
          difficulty: 'MEDIUM',
          status: 'PUBLISHED',
          categoryId: 'c1',
          authorId: 'u1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 12, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    }
    fetchMock.mockResolvedValue(json(paged))

    const result = await listRecipes({ page: 1, pageSize: 12, difficulty: 'MEDIUM' })
    expect(result.items[0]?.slug).toBe('pho-bo')
    expect(result.meta.totalCount).toBe(1)
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/recipes?')
    expect(url).toContain('difficulty=MEDIUM')
  })

  it('searches, fetches detail, and publishes with auth header', async () => {
    fetchMock.mockResolvedValue(json({ items: [], meta: {} }))
    await searchRecipes('pho', { page: 1 })
    expect((fetchMock.mock.calls[0] as [string])[0]).toContain('/recipes/search?q=pho')

    fetchMock.mockResolvedValue(json({ id: 'r1', slug: 'pho-bo', steps: [], ingredients: [], images: [] }))
    const detail = await getRecipeBySlug('pho-bo')
    expect(detail.slug).toBe('pho-bo')

    fetchMock.mockResolvedValue(json({ id: 'r1' }))
    await createRecipe('tok', {
      title: 'Pho Bo ngon',
      description: 'Mo ta du 10 ky tu tro len',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      prepTime: 15,
      cookTime: 30,
      servings: 2,
    })
    const [, createInit] = fetchMock.mock.calls[2] as [string, RequestInit]
    expect((createInit.headers as Record<string, string>).Authorization).toBe('Bearer tok')

    fetchMock.mockResolvedValue(json({ message: 'ok' }))
    await publishRecipe('tok', 'r1')
    const [pubUrl, pubInit] = fetchMock.mock.calls[3] as [string, RequestInit]
    expect(pubUrl).toContain('/recipes/r1/publish')
    expect(pubInit.method).toBe('PATCH')

    fetchMock.mockImplementation(() => Promise.resolve(json(null)))
    await archiveRecipe('tok', 'r1')
    await deleteRecipe('tok', 'r1')
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })
})

describe('categories api client (typed)', () => {
  it('lists, details, and mutates with auth', async () => {
    fetchMock.mockResolvedValue(json([{ id: 'c1', name: 'Mon nuoc', slug: 'mon-nuoc', orderIndex: 0, createdAt: '' }]))
    const cats = await listCategories()
    expect(cats[0]?.slug).toBe('mon-nuoc')

    fetchMock.mockResolvedValue(json({ id: 'c1', slug: 'mon-nuoc', recipes: { items: [], meta: {} } }))
    const detail = await getCategoryBySlug('mon-nuoc')
    expect(detail.slug).toBe('mon-nuoc')

    fetchMock.mockResolvedValue(json({ id: 'c1' }))
    await createCategory('tok', { name: 'Mon chay' })
    const [, init] = fetchMock.mock.calls[2] as [string, RequestInit]
    expect(init.method).toBe('POST')

    fetchMock.mockResolvedValue(json(null))
    await deleteCategory('tok', 'c1')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
