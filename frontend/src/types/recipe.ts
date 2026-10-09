export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

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
