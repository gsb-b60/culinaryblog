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

export interface RecipeFilters {
  categoryId?: string
  difficulty?: RecipeDifficulty
  status?: RecipeStatus
  authorId?: string
  minPrepTime?: number
  maxPrepTime?: number
  searchQuery?: string
}

export type RecipeListQuery = PaginationParams & SortParams & RecipeFilters

export type PagedRecipes = PagedResult<RecipeSummary>

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
