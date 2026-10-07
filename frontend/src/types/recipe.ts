export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface RecipeSummary {
  id: string
  title: string
  slug: string
  description: string
  status: RecipeStatus
  authorId: string
  authorName?: string
  categoryName?: string
}

export interface RecipePage {
  items: RecipeSummary[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
