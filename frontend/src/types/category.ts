import type { PagedResult } from './api'
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

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  orderIndex?: number;
  recipeCount: number;
  createdAt?: string | Date;
}

export interface RecipeSummaryDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  status: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface CategoryDetailDto {
  category: CategoryDto;
  recipes: {
    items: RecipeSummaryDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
