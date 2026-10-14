import { apiRequest } from './api'
import type { Category, PagedResult, RecipeQuery, RecipeSummary } from '../types/recipes'

export function getRecipes(query: RecipeQuery, signal?: AbortSignal) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  return apiRequest<PagedResult<RecipeSummary>>('/recipes?' + params.toString(), { signal })
}

// Load every category page so the dropdown remains complete beyond 50 categories.
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const categories: Category[] = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await apiRequest<PagedResult<Category>>(
      '/categories?page=' + page + '&pageSize=50', { signal },
    )
    categories.push(...result.items)
    hasNextPage = result.meta.hasNextPage
    page += 1
  }
  return categories
}
