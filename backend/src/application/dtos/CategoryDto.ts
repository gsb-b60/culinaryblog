export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  orderIndex?: number;
  recipeCount?: number;
  createdAt?: Date;
}

export interface CategoryDetailDto {
  category: CategoryDto;
  recipes: {
    items: import('./RecipeDto.js').RecipeSummaryDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  orderIndex?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  orderIndex?: number;
}
