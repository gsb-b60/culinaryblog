import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCategories, getRecipes } from '../lib/recipes'

afterEach(() => vi.unstubAllGlobals())
describe('public recipe API client', () => {
  it('encodes numeric filters including zero and omits undefined fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], meta: {} })))
    vi.stubGlobal('fetch', fetchMock)
    await getRecipes({ page: 1, pageSize: 12, maxCookTime: 0, difficulty: 'EASY', minServings: undefined })
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('maxCookTime')).toBe('0')
    expect(url.searchParams.get('difficulty')).toBe('EASY')
    expect(url.searchParams.has('minServings')).toBe(false)
  })

  it('loads categories across pages instead of truncating the dropdown', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: 'a', name: 'First' }], meta: { hasNextPage: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: 'b', name: 'Last' }], meta: { hasNextPage: false } })))
    vi.stubGlobal('fetch', fetchMock)
    expect(await getCategories()).toEqual([{ id: 'a', name: 'First' }, { id: 'b', name: 'Last' }])
    expect(fetchMock.mock.calls[1][0]).toContain('/categories?page=2&pageSize=50')
  })
})
