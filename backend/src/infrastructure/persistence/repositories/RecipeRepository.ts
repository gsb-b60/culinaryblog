import { PrismaClient, Recipe as PrismaRecipe, Prisma } from '@prisma/client';
import { IRecipeRepository, RecipeFilters, RecipeSortOptions } from '../../../domain/repositories/IRecipeRepository.js';
import { Recipe, RecipeProps } from '../../../domain/entities/Recipe.js';
import { PagedResult, createPagedResult } from '../../../application/dtos/PagedResult.js';

export class RecipeRepository implements IRecipeRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(prismaRecipe: PrismaRecipe & { 
    author?: { displayName: string };
    category?: { name: string };
  }): Recipe {
    const props: RecipeProps = {
      id: prismaRecipe.id,
      title: prismaRecipe.title,
      slug: prismaRecipe.slug,
      description: prismaRecipe.description,
      instructions: prismaRecipe.instructions ?? undefined,
      prepTime: prismaRecipe.prepTime,
      cookTime: prismaRecipe.cookTime,
      servings: prismaRecipe.servings,
      difficulty: prismaRecipe.difficulty,
      status: prismaRecipe.status,
      categoryId: prismaRecipe.categoryId,
      authorId: prismaRecipe.authorId,
      nutrition: {
        calories: prismaRecipe.nutritionCalories ? Number(prismaRecipe.nutritionCalories) : undefined,
        protein: prismaRecipe.nutritionProtein ? Number(prismaRecipe.nutritionProtein) : undefined,
        carbohydrates: prismaRecipe.nutritionCarbohydrates ? Number(prismaRecipe.nutritionCarbohydrates) : undefined,
        fat: prismaRecipe.nutritionFat ? Number(prismaRecipe.nutritionFat) : undefined,
        fiber: prismaRecipe.nutritionFiber ? Number(prismaRecipe.nutritionFiber) : undefined,
        sodium: prismaRecipe.nutritionSodium ? Number(prismaRecipe.nutritionSodium) : undefined,
      },
      publishedAt: prismaRecipe.publishedAt ?? undefined,
      createdAt: prismaRecipe.createdAt,
      updatedAt: prismaRecipe.updatedAt,
      isDeleted: prismaRecipe.isDeleted,
      version: prismaRecipe.version,
    };
    return Recipe.reconstruct(props);
  }

  private toSummaryDto(recipe: Recipe, categoryName?: string, authorName?: string) {
    return {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug.getValue(),
      description: recipe.description,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      status: recipe.status,
      categoryId: recipe.categoryId,
      categoryName,
      authorId: recipe.authorId,
      authorName,
      publishedAt: recipe.publishedAt,
      createdAt: recipe.createdAt,
    };
  }

  async findById(id: string): Promise<Recipe | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id, isDeleted: false },
      include: {
        steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
        ingredients: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
        images: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
      },
    });
    return recipe ? this.toDomain(recipe) : null;
  }

  async findBySlug(slug: string): Promise<Recipe | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug, isDeleted: false },
      include: {
        steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
        ingredients: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
        images: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
        author: { select: { displayName: true } },
        category: { select: { name: true } },
      },
    });
    return recipe ? this.toDomain(recipe) : null;
  }

  async findMany(
    filters: RecipeFilters,
    sort: RecipeSortOptions,
    page: number,
    pageSize: number
  ): Promise<PagedResult<Recipe>> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderBy(sort);

    const [items, totalCount] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { displayName: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const recipes = items.map(r => this.toDomain(r));
    const summaries = recipes.map(r => this.toSummaryDto(r, r.categoryId, r.authorId));
    
    return createPagedResult(summaries as any, page, pageSize, totalCount);
  }

  async findPublishedByCategory(
    categoryId: string,
    page: number,
    pageSize: number,
    sort?: RecipeSortOptions
  ): Promise<PagedResult<Recipe>> {
    const where: Prisma.RecipeWhereInput = {
      categoryId,
      status: 'PUBLISHED',
      isDeleted: false,
    };

    const orderBy = sort ? this.buildOrderBy(sort) : { createdAt: 'desc' as const };

    const [items, totalCount] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { displayName: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const recipes = items.map(r => this.toDomain(r));
    const summaries = recipes.map(r => this.toSummaryDto(r, r.categoryId, r.authorId));
    
    return createPagedResult(summaries as any, page, pageSize, totalCount);
  }

  async search(
    query: string,
    filters: RecipeFilters,
    sort: RecipeSortOptions,
    page: number,
    pageSize: number
  ): Promise<PagedResult<Recipe>> {
    const where = this.buildWhereClause({ ...filters, searchQuery: query });
    const orderBy = this.buildOrderBy(sort);

    const [items, totalCount] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { displayName: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    const recipes = items.map(r => this.toDomain(r));
    const summaries = recipes.map(r => this.toSummaryDto(r, r.categoryId, r.authorId));
    
    return createPagedResult(summaries as any, page, pageSize, totalCount);
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const props = recipe.toPersistence();
    
    const data: Prisma.RecipeCreateInput = {
      id: props.id,
      title: props.title,
      slug: props.slug.getValue(),
      description: props.description,
      instructions: props.instructions,
      prepTime: props.prepTime,
      cookTime: props.cookTime,
      servings: props.servings,
      difficulty: props.difficulty,
      status: props.status,
      categoryId: props.categoryId,
      authorId: props.authorId,
      nutritionCalories: props.nutrition?.calories,
      nutritionProtein: props.nutrition?.protein,
      nutritionCarbohydrates: props.nutrition?.carbohydrates,
      nutritionFat: props.nutrition?.fat,
      nutritionFiber: props.nutrition?.fiber,
      nutritionSodium: props.nutrition?.sodium,
      publishedAt: props.publishedAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      isDeleted: props.isDeleted,
      version: props.version,
    };

    const saved = await this.prisma.recipe.upsert({
      where: { id: props.id },
      create: data,
      update: data,
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.recipe.count({
      where: { slug, isDeleted: false },
    });
    return count > 0;
  }

  async count(filters: RecipeFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.recipe.count({ where });
  }

  private buildWhereClause(filters: RecipeFilters): Prisma.RecipeWhereInput {
    const where: Prisma.RecipeWhereInput = { isDeleted: false };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.status) where.status = filters.status;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.minPrepTime !== undefined || filters.maxPrepTime !== undefined) {
      where.prepTime = {};
      if (filters.minPrepTime !== undefined) where.prepTime.gte = filters.minPrepTime;
      if (filters.maxPrepTime !== undefined) where.prepTime.lte = filters.maxPrepTime;
    }
    if (filters.minCookTime !== undefined || filters.maxCookTime !== undefined) {
      where.cookTime = {};
      if (filters.minCookTime !== undefined) where.cookTime.gte = filters.minCookTime;
      if (filters.maxCookTime !== undefined) where.cookTime.lte = filters.maxCookTime;
    }
    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { description: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(sort: RecipeSortOptions): Prisma.RecipeOrderByWithRelationInput {
    const { field, order } = sort;
    const fieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      title: 'title',
      prepTime: 'prepTime',
      cookTime: 'cookTime',
      publishedAt: 'publishedAt',
    };
    return { [fieldMap[field] || 'createdAt']: order };
  }
}