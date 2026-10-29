import type { PagedResult, PaginationParams } from './api'

export type CategoryListQuery = PaginationParams & { searchQuery?: string }
import type { RecipeSummary } from './recipe'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  orderIndex: number
  recipeCount?: number
  createdAt: string
}

export interface CategoryDetail extends Category {
  recipes: PagedResult<RecipeSummary>
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  imageUrl?: string
  orderIndex?: number
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  imageUrl?: string
  orderIndex?: number
}
