export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  recipeCount: number;
}

export interface CategoryDetailDto extends CategoryDto {
  recipes: import('./PagedResult.js').PagedResult<import('./RecipeDto.js').RecipeSummaryDto>;
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
