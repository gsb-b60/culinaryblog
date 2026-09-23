import { RecipeDifficulty } from '../../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../../domain/enums/RecipeStatus.js';

export interface RecipeNutritionDto {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeSummaryDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  categoryId: string;
  categoryName?: string;
  authorId: string;
  authorName?: string;
  publishedAt?: Date;
  createdAt: Date;
}

export interface RecipeDetailDto extends RecipeSummaryDto {
  instructions?: string;
  nutrition?: RecipeNutritionDto;
  steps: RecipeStepDto[];
  ingredients: RecipeIngredientDto[];
  images: RecipeImageDto[];
}

export interface RecipeStepDto {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes?: number;
  imageUrl?: string;
}

export interface RecipeIngredientDto {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  orderIndex: number;
}

export interface RecipeImageDto {
  id: string;
  originalUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  orderIndex: number;
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  categoryId: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions?: string;
  nutrition?: RecipeNutritionDto;
  steps?: CreateRecipeStepInput[];
  ingredients?: CreateRecipeIngredientInput[];
}

export interface CreateRecipeStepInput {
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes?: number;
  imageUrl?: string;
}

export interface CreateRecipeIngredientInput {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  orderIndex: number;
}

export interface UpdateRecipeInput {
  title?: string;
  description?: string;
  categoryId?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  instructions?: string;
  nutrition?: RecipeNutritionDto;
}