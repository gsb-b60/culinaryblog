import { PrismaClient, RecipeStatus } from '@prisma/client';

import { Slug } from '../../../domain/value-objects/Slug.js';

import { ADDITIONAL_REAL_RECIPES } from './additional-recipe-data.js';
import { getSeedRecipeImage } from './recipe-image-data.js';
import { addRecipeStepDetails } from './recipe-step-enhancements.js';
import { REAL_RECIPE_DATA, type RealRecipeSeed } from './recipe-data.js';

const CURATED_RECIPES = [...REAL_RECIPE_DATA, ...ADDITIONAL_REAL_RECIPES];

function validateRecipe(recipe: RealRecipeSeed): void {
  if (!recipe.slug || !recipe.title || !recipe.description || !recipe.instructions) {
    throw new Error(`Recipe "${recipe.slug || recipe.title}" is missing required text`);
  }
  if (recipe.prepTime < 0 || recipe.cookTime < 0 || recipe.servings < 1) {
    throw new Error(`Recipe "${recipe.slug}" has invalid time or serving values`);
  }
  if (recipe.ingredients.length === 0) {
    throw new Error(`Recipe "${recipe.slug}" must contain at least one ingredient`);
  }
  const detailedSteps = addRecipeStepDetails(recipe.slug, recipe.steps);
  if (detailedSteps.length < 4) {
    throw new Error(`Recipe "${recipe.slug}" needs at least four recipe-specific steps`);
  }
  const stepTitles = detailedSteps.map((step) => step.title.trim().toLowerCase());
  if (new Set(stepTitles).size !== stepTitles.length) {
    throw new Error(`Recipe "${recipe.slug}" contains duplicate step titles`);
  }
  recipe.ingredients.forEach((ingredient, index) => {
    if (!ingredient.name || ingredient.quantity <= 0 || !ingredient.unit) {
      throw new Error(`Recipe "${recipe.slug}" has invalid ingredient #${index + 1}`);
    }
  });
}

export async function seedRecipes(
  prisma: PrismaClient,
  _authorIds: string[],
  _categoryIds: string[],
): Promise<void> {
  const authors = await prisma.user.findMany({
    where: { email: { in: CURATED_RECIPES.map((recipe) => recipe.authorEmail) } },
    select: { id: true, email: true },
  });
  const authorByEmail = new Map(authors.map((author) => [author.email, author.id]));

  const categories = await prisma.category.findMany({
    where: { slug: { in: CURATED_RECIPES.map((recipe) => recipe.categorySlug) } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  // Remove the old generated catalog for the dedicated seed authors before
  // inserting the curated catalog. This prevents legacy fake recipes from
  // remaining visible after the seed is migrated.
  if (authors.length > 0) {
    await prisma.recipe.deleteMany({
      where: { authorId: { in: authors.map((author) => author.id) } },
    });
  }

  for (const recipe of CURATED_RECIPES) {
    validateRecipe(recipe);
    const authorId = authorByEmail.get(recipe.authorEmail);
    const categoryId = categoryBySlug.get(recipe.categorySlug);
    if (!authorId)
      throw new Error(`Missing author "${recipe.authorEmail}" for recipe "${recipe.slug}"`);
    if (!categoryId)
      throw new Error(`Missing category "${recipe.categorySlug}" for recipe "${recipe.slug}"`);

    const slug = Slug.create(recipe.slug).getValue();
    const publishedAt = new Date(recipe.publishedAt);
    const ingredients = recipe.ingredients.map((ingredient, orderIndex) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes,
      orderIndex,
    }));
    const steps = addRecipeStepDetails(recipe.slug, recipe.steps).map((step, index) => ({
      stepNumber: index + 1,
      title: step.title,
      description: step.description,
      timerMinutes: step.timerMinutes,
    }));
    const recipeImage = getSeedRecipeImage(recipe.slug);

    await prisma.recipe.upsert({
      where: { slug },
      create: {
        title: recipe.title,
        slug,
        description: recipe.description,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        status: RecipeStatus.PUBLISHED,
        categoryId,
        authorId,
        publishedAt,
        ingredients: { create: ingredients },
        steps: { create: steps },
        images: {
          create: {
            originalUrl: recipeImage.originalUrl,
            altText: recipeImage.altText,
            isPrimary: true,
            orderIndex: 0,
          },
        },
      },
      update: {
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        status: RecipeStatus.PUBLISHED,
        categoryId,
        authorId,
        publishedAt,
        ingredients: { deleteMany: {}, create: ingredients },
        steps: { deleteMany: {}, create: steps },
        images: {
          deleteMany: {},
          create: {
            originalUrl: recipeImage.originalUrl,
            altText: recipeImage.altText,
            isPrimary: true,
            orderIndex: 0,
          },
        },
      },
    });
  }

  console.log(`✓ Seeded ${CURATED_RECIPES.length} curated recipes with ingredients, steps, and real food images`);
}
