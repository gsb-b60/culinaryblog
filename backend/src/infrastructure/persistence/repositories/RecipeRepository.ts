import { PrismaClient, Recipe as PrismaRecipe, Prisma } from '@prisma/client';

import { PagedResult, createPagedResult } from '../../../application/dtos/PagedResult.js';
import { Recipe, RecipeProps } from '../../../domain/entities/Recipe.js';
import { RecipeDifficulty } from '../../../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../../../domain/enums/RecipeStatus.js';
import {
  IRecipeRepository,
  RecipeFilters,
  RecipeSortOptions,
} from '../../../domain/repositories/IRecipeRepository.js';
import { Slug } from '../../../domain/value-objects/Slug.js';

interface RecipeSearchRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  status: string;
  categoryId: string;
  authorId: string;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  categoryName: string | null;
  relevanceScore: number;
}

/**
 * Convert user input into a safe prefix tsquery. Diacritics are stripped the
 * same way the database's `unaccent`-backed search vector strips them, so
 * "phở bò" and "pho bo" produce identical terms.
 */
export function buildPrefixTsQuery(input: string): string {
  const normalized = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  return normalized
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
    .slice(0, 16)
    .map((token) => `${token}:*`)
    .join(' & ');
}

export class RecipeRepository implements IRecipeRepository {
  /** Bind recipe persistence to the supplied Prisma client. */
  constructor(private prisma: PrismaClient) {}

  /** Reconstruct a recipe aggregate from Prisma data and attach display metadata. */
  private toDomain(
    prismaRecipe: PrismaRecipe & {
      author?: { displayName: string };
      category?: { name: string };
    },
  ): Recipe {
    const props: RecipeProps = {
      id: prismaRecipe.id,
      title: prismaRecipe.title,
      slug: Slug.fromExisting(prismaRecipe.slug),
      description: prismaRecipe.description,
      instructions: prismaRecipe.instructions ?? undefined,
      prepTime: prismaRecipe.prepTime,
      cookTime: prismaRecipe.cookTime,
      servings: prismaRecipe.servings,
      difficulty: prismaRecipe.difficulty as RecipeDifficulty,
      status: prismaRecipe.status as RecipeStatus,
      categoryId: prismaRecipe.categoryId,
      authorId: prismaRecipe.authorId,
      nutrition: {
        calories: prismaRecipe.nutritionCalories
          ? Number(prismaRecipe.nutritionCalories)
          : undefined,
        protein: prismaRecipe.nutritionProtein ? Number(prismaRecipe.nutritionProtein) : undefined,
        carbohydrates: prismaRecipe.nutritionCarbohydrates
          ? Number(prismaRecipe.nutritionCarbohydrates)
          : undefined,
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
    const recipe = Recipe.reconstruct(props);
    // Attach author and category names for summary DTO
    (recipe as any)._authorName = prismaRecipe.author?.displayName;
    (recipe as any)._categoryName = prismaRecipe.category?.name;
    return recipe;
  }

  /** Project recipe fields and display names into a paginated summary DTO. */
  private toSummaryDto(recipe: Recipe, categoryName: string, authorName: string) {
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

  /** Find an active recipe by identifier and reconstruct its aggregate. */
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

  /** Find an active recipe by slug and reconstruct its aggregate. */
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

  /** Load recipe summaries and pagination metadata matching repository filters. */
  async findMany(
    filters: RecipeFilters,
    sort: RecipeSortOptions,
    page: number,
    pageSize: number,
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

    const recipes = items.map((r) => this.toDomain(r));
    const summaries = recipes.map((r) =>
      this.toSummaryDto(
        r,
        (r as any)._categoryName || r.categoryId,
        (r as any)._authorName || r.authorId,
      ),
    );

    return createPagedResult(summaries as any, page, pageSize, totalCount);
  }

  /**
   * Load a category's published recipes, plus the viewer's own drafts when a
   * viewer is supplied, with pagination.
   */
  async findPublishedByCategory(
    categoryId: string,
    page: number,
    pageSize: number,
    sort?: RecipeSortOptions,
    viewerId?: string,
  ): Promise<PagedResult<Recipe>> {
    const where: Prisma.RecipeWhereInput = {
      categoryId,
      isDeleted: false,
      ...(viewerId
        ? {
            OR: [
              { status: 'PUBLISHED' },
              { status: 'DRAFT', authorId: viewerId },
            ],
          }
        : { status: 'PUBLISHED' }),
    };

    const orderBy = this.buildOrderBy(sort ?? { field: 'createdAt', order: 'desc' });

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

    const recipes = items.map((r) => this.toDomain(r));
    const summaries = recipes.map((r) =>
      this.toSummaryDto(
        r,
        (r as any)._categoryName || r.categoryId,
        (r as any)._authorName || r.authorId,
      ),
    );

    return createPagedResult(summaries as any, page, pageSize, totalCount);
  }

  /**
   * Full-text search over the `search_vector` column maintained by the database
   * trigger. Prefix tsquery terms keep partial words useful, and ranking is
   * returned to clients as `relevanceScore`.
   */
  async search(
    query: string,
    filters: RecipeFilters,
    sort: RecipeSortOptions | undefined,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<Recipe>> {
    const tsQuery = buildPrefixTsQuery(query);
    if (!tsQuery) return createPagedResult([], page, pageSize, 0);

    const conditions: Prisma.Sql[] = [
      Prisma.sql`r."is_deleted" = false`,
      Prisma.sql`r."status" = ${filters.status ?? RecipeStatus.PUBLISHED}::"RecipeStatus"`,
      Prisma.sql`r."search_vector" @@ to_tsquery('simple', ${tsQuery})`,
    ];
    if (filters.categoryId) conditions.push(Prisma.sql`r."category_id" = ${filters.categoryId}`);
    if (filters.difficulty) {
      conditions.push(Prisma.sql`r."difficulty" = ${filters.difficulty}::"RecipeDifficulty"`);
    }
    if (filters.authorId) conditions.push(Prisma.sql`r."author_id" = ${filters.authorId}`);
    if (filters.minPrepTime !== undefined) {
      conditions.push(Prisma.sql`r."prep_time" >= ${filters.minPrepTime}`);
    }
    if (filters.maxPrepTime !== undefined) {
      conditions.push(Prisma.sql`r."prep_time" <= ${filters.maxPrepTime}`);
    }
    if (filters.minCookTime !== undefined) {
      conditions.push(Prisma.sql`r."cook_time" >= ${filters.minCookTime}`);
    }
    if (filters.maxCookTime !== undefined) {
      conditions.push(Prisma.sql`r."cook_time" <= ${filters.maxCookTime}`);
    }
    if (filters.minServings !== undefined) {
      conditions.push(Prisma.sql`r."servings" >= ${filters.minServings}`);
    }

    const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const rank = Prisma.sql`ts_rank(r."search_vector", to_tsquery('simple', ${tsQuery}))`;
    const sortColumns: Record<RecipeSortOptions['field'], string> = {
      createdAt: 'created_at',
      title: 'title',
      prepTime: 'prep_time',
      cookTime: 'cook_time',
      publishedAt: 'published_at',
    };
    const orderBy = sort
      ? Prisma.sql`r.${Prisma.raw(`"${sortColumns[sort.field]}"`)} ${Prisma.raw(
          sort.order === 'asc' ? 'ASC' : 'DESC',
        )}, r."id" ASC`
      : Prisma.sql`${rank} DESC, r."id" ASC`;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<RecipeSearchRow[]>(Prisma.sql`
        SELECT
          r."id",
          r."title",
          r."slug",
          r."description",
          r."prep_time" AS "prepTime",
          r."cook_time" AS "cookTime",
          r."servings",
          r."difficulty",
          r."status",
          r."category_id" AS "categoryId",
          r."author_id" AS "authorId",
          r."published_at" AS "publishedAt",
          r."created_at" AS "createdAt",
          u."display_name" AS "authorName",
          c."name" AS "categoryName",
          ${rank} AS "relevanceScore"
        FROM "recipes" r
        INNER JOIN "users" u ON u."id" = r."author_id"
        INNER JOIN "categories" c ON c."id" = r."category_id"
        ${where}
        ORDER BY ${orderBy}
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "recipes" r
        ${where}
      `),
    ]);

    const summaries = rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      prepTime: row.prepTime,
      cookTime: row.cookTime,
      servings: row.servings,
      difficulty: row.difficulty as RecipeDifficulty,
      status: row.status as RecipeStatus,
      categoryId: row.categoryId,
      categoryName: row.categoryName ?? row.categoryId,
      authorId: row.authorId,
      authorName: row.authorName ?? row.authorId,
      publishedAt: row.publishedAt ?? undefined,
      createdAt: row.createdAt,
      relevanceScore: Number(row.relevanceScore),
    }));

    return createPagedResult(
      summaries as any,
      page,
      pageSize,
      Number(countRows[0]?.count ?? 0),
    );
  }

  /** Persist recipe scalar fields and foreign keys without mixing relation writes. */
  async save(recipe: Recipe): Promise<Recipe> {
    const props = recipe.toPersistence();

    const data: any = {
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

  /** Permanently remove a recipe row; lifecycle soft deletion is handled separately. */
  async delete(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }

  /** Check whether an active recipe already uses the supplied slug. */
  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.recipe.count({
      where: { slug, isDeleted: false },
    });
    return count > 0;
  }

  /** Count recipes matching the supplied repository filters. */
  async count(filters: RecipeFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.recipe.count({ where });
  }

  /** Translate repository filters into a Prisma predicate excluding deleted recipes. */
  private buildWhereClause(filters: RecipeFilters): Prisma.RecipeWhereInput {
    const where: Prisma.RecipeWhereInput = { isDeleted: false };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.status) where.status = filters.status;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.minServings !== undefined) where.servings = { gte: filters.minServings };
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

  /** Translate requested sorting into Prisma ordering with repository defaults. */
  private buildOrderBy(sort: RecipeSortOptions): Prisma.RecipeOrderByWithRelationInput[] {
    const { field, order } = sort;
    const fieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      title: 'title',
      prepTime: 'prepTime',
      cookTime: 'cookTime',
      publishedAt: 'publishedAt',
    };
    return [{ [fieldMap[field] || 'createdAt']: order }, { id: 'asc' }];
  }
}
