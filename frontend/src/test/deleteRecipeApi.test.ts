import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, deleteRecipe, getManageableRecipes } from '../lib/api'

afterEach(() => vi.unstubAllGlobals())
describe('Recipe API client', () => {
  it('sends authenticated DELETE and accepts an empty 204 body', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    expect(await deleteRecipe('token', 'recipe-1')).toBeNull()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/recipes/recipe-1'), expect.objectContaining({
      method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }))
  })
  it('preserves 404 errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Recipe not found' }), { status: 404 })))
    await expect(deleteRecipe('token', 'missing')).rejects.toBeInstanceOf(ApiError)
  })
  it('requests the manageable list with pagination', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], meta: {} }), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    await getManageableRecipes('token', 2)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/recipes/manageable?page=2&pageSize=12'), expect.any(Object))
  })
})
