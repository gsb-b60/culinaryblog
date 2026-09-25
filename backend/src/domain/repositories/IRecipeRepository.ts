import { PagedResult } from '../../application/dtos/PagedResult.js';
import { Recipe, RecipeProps } from '../entities/Recipe.js';

export interface RecipeFilters {
  categoryId?: string;
  difficulty?: RecipeProps['difficulty'];
  status?: RecipeProps['status'];
  authorId?: string;
  minPrepTime?: number;
  maxPrepTime?: number;
  minCookTime?: number;
  maxCookTime?: number;
  searchQuery?: string;
}

export interface RecipeSortOptions {
  field: 'createdAt' | 'title' | 'prepTime' | 'cookTime' | 'publishedAt';
  order: 'asc' | 'desc';
}

export interface IRecipeRepository {
  findById(id: string): Promise<Recipe | null>;
  findBySlug(slug: string): Promise<Recipe | null>;
  findAuthorId(id: string): Promise<string | null>;
  hasActiveSteps(recipeId: string): Promise<boolean>;
  findMany(
    filters: RecipeFilters,
    sort: RecipeSortOptions,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<Recipe>>;
  findPublishedByCategory(
    categoryId: string,
    page: number,
    pageSize: number,
    sort?: RecipeSortOptions,
  ): Promise<PagedResult<Recipe>>;
  search(
    query: string,
    filters: RecipeFilters,
    sort: RecipeSortOptions,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<Recipe>>;
  save(recipe: Recipe): Promise<Recipe>;
  delete(id: string): Promise<void>;
  existsBySlug(slug: string): Promise<boolean>;
  count(filters: RecipeFilters): Promise<number>;
}
