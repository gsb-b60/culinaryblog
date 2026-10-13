export type RecipeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export interface RecipeSummary {
  id: string
  title: string
  slug: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: RecipeDifficulty
  categoryId: string
  categoryName?: string
  authorName?: string
}

export interface Category {
  id: string
  name: string
  recipeCount?: number
}

export interface PagedResult<T> {
  items: T[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface RecipeQuery {
  categoryId?: string
  difficulty?: RecipeDifficulty
  maxCookTime?: number
  minServings?: number
  page: number
  pageSize: number
}
