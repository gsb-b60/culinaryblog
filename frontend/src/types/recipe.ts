import type { PagedResult, PaginationParams, SortParams } from './api'

export type RecipeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface RecipeNutrition {
  calories?: number
  protein?: number
  carbohydrates?: number
  fat?: number
  fiber?: number
  sodium?: number
}

export interface RecipeSummary {
  id: string
  title: string
  slug: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty: RecipeDifficulty
  status: RecipeStatus
  categoryId: string
  categoryName?: string
  authorId: string
  authorName?: string
  publishedAt?: string
  createdAt: string
}

export interface RecipeStep {
  id: string
  stepNumber: number
  title: string
  description: string
  timerMinutes?: number
  imageUrl?: string
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity?: number
  unit?: string
  notes?: string
  orderIndex: number
}

export interface RecipeImage {
  id: string
  originalUrl: string
  mediumUrl?: string
  thumbnailUrl?: string
  altText?: string
  isPrimary: boolean
  orderIndex: number
}

export interface RecipeDetail extends RecipeSummary {
  instructions?: string
  nutrition?: RecipeNutrition
  steps: RecipeStep[]
  ingredients: RecipeIngredient[]
  images: RecipeImage[]
}

/** Recipe management DTO (used by /dashboard/recipes) */
export interface Recipe {
  id: string
  title: string
  description: string
  slug: string
  status: RecipeStatus
  authorId: string
  authorName?: string
  categoryName?: string
  updatedAt: string
  publishedAt?: string
  version: number
  steps: { id: string; stepNumber: number; title: string; description: string }[]
}

export interface RecipeOverview {
  stats: { total: number; published: number; draft: number; archived: number }
  recentRecipes: Recipe[]
}

export interface RecipeFilters {
  categoryId?: string
  difficulty?: RecipeDifficulty
  status?: RecipeStatus
  authorId?: string
  minPrepTime?: number
  maxPrepTime?: number
  minCookTime?: number
  maxCookTime?: number
  minServings?: number
  searchQuery?: string
}

export type RecipeListQuery = PaginationParams & SortParams & RecipeFilters

export type PagedRecipes = PagedResult<RecipeSummary>

/** Paginated response for recipe management list */
export interface RecipePage {
  items: Recipe[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface CreateRecipePayload {
  title: string
  description: string
  categoryId: string
  prepTime: number
  cookTime: number
  servings: number
  difficulty?: RecipeDifficulty
  instructions?: string
  nutrition?: RecipeNutrition
}

export interface UpdateRecipePayload {
  title?: string
  description?: string
  categoryId?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: RecipeDifficulty
  instructions?: string
  nutrition?: RecipeNutrition
}

export interface CreateStepPayload {
  title: string
  description: string
  timerMinutes?: number
  imageUrl?: string
}

export interface CreateIngredientPayload {
  name: string
  quantity?: number
  unit?: string
  notes?: string
  orderIndex?: number
}
