import { PrismaClient, RecipeDifficulty, RecipeStatus } from '@prisma/client';
import { generateRecipeData, vietnameseRecipeNames } from './faker-data.js';
import { Slug } from '../../../../domain/value-objects/Slug.js';

export async function seedRecipes(
  prisma: PrismaClient,
  authorIds: string[],
  categoryIds: string[]
): Promise<void> {
  let totalRecipes = 0;
  const targetRecipes = 100;

  // Distribute recipes across authors and categories
  const recipesPerAuthor = Math.ceil(targetRecipes / authorIds.length);
  
  for (const authorId of authorIds) {
    const recipesForThisAuthor = Math.min(recipesPerAuthor, targetRecipes - totalRecipes);
    
    for (let i = 0; i < recipesForThisAuthor; i++) {
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const recipeData = generateRecipeData(categoryId, authorId);
      
      const slug = Slug.create(recipeData.title).getValue();
      
      // Check if slug exists, append number if needed
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.recipe.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      const recipe = await prisma.recipe.create({
        data: {
          title: recipeData.title,
          slug: finalSlug,
          description: recipeData.description,
          instructions: recipeData.instructions,
          prepTime: recipeData.prepTime,
          cookTime: recipeData.cookTime,
          servings: recipeData.servings,
          difficulty: recipeData.difficulty,
          status: RecipeStatus.PUBLISHED,
          categoryId: recipeData.categoryId,
          authorId: recipeData.authorId,
          nutritionCalories: recipeData.nutrition?.calories,
          nutritionProtein: recipeData.nutrition?.protein,
          nutritionCarbohydrates: recipeData.nutrition?.carbohydrates,
          nutritionFat: recipeData.nutrition?.fat,
          nutritionFiber: recipeData.nutrition?.fiber,
          nutritionSodium: recipeData.nutrition?.sodium,
          publishedAt: new Date(),
          ingredients: {
            create: recipeData.ingredients.map(ing => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
              orderIndex: ing.orderIndex,
            })),
          },
          steps: {
            create: recipeData.steps.map(step => ({
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              timerMinutes: step.timerMinutes,
              imageUrl: step.imageUrl,
            })),
          },
        },
      });
      
      totalRecipes++;
      if (totalRecipes >= targetRecipes) break;
    }
    if (totalRecipes >= targetRecipes) break;
  }

  console.log(`✓ Created ${totalRecipes} recipes with ingredients and steps`);
}