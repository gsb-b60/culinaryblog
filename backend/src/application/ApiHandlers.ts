import { randomUUID } from 'node:crypto';

import { PrismaClient, Prisma } from '@prisma/client';

import { env } from '../config-middleware/config/env.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../config-middleware/shared/errors/AppError.js';
import { Category } from '../domain/entities/Category.js';
import { Recipe } from '../domain/entities/Recipe.js';
import { User } from '../domain/entities/User.js';
import { RecipeDifficulty } from '../domain/enums/RecipeDifficulty.js';
import { RecipeStatus } from '../domain/enums/RecipeStatus.js';
import { UserRole } from '../domain/enums/UserRole.js';
import { ICategoryRepository } from '../domain/repositories/ICategoryRepository.js';
import { IRecipeRepository } from '../domain/repositories/IRecipeRepository.js';
import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { EmailAddress } from '../domain/value-objects/EmailAddress.js';
import { Slug } from '../domain/value-objects/Slug.js';
import { PasswordService } from '../infrastructure/auth/PasswordService.js';

import { CommandBus } from './command-bus.js';
import { LoginCommand, RegisterCommand, LogoutCommand, GoogleAuthCommand, UpdateProfileCommand } from './commands/auth/AuthCommands.js';
import {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
} from './commands/categories/CategoryCommands.js';
import {
  AddRecipeIngredientCommand,
  AddRecipeStepCommand,
  ArchiveRecipeCommand,
  CreateRecipeCommand,
  DeleteRecipeCommand,
  DeleteRecipeIngredientCommand,
  DeleteRecipeStepCommand,
  PublishRecipeCommand,
  UnpublishRecipeCommand,
  UpdateRecipeCommand,
  UpdateRecipeIngredientCommand,
  UpdateRecipeStepCommand,
} from './commands/recipes/RecipeCommands.js';
import { CategoryDetailDto, CategoryDto } from './dtos/CategoryDto.js';
import { PagedResult } from './dtos/PagedResult.js';
import { RecipeDetailDto, RecipeSummaryDto } from './dtos/RecipeDto.js';
import { AuthTokensDto, UserDto } from './dtos/UserDto.js';
import { IJwtService } from './interfaces/IJwtService.js';
import { GetCurrentUserQuery } from './queries/auth/AuthQueries.js';
import { GetCategoriesQuery, GetCategoryBySlugQuery } from './queries/categories/CategoryQueries.js';
import { GetRecipeBySlugQuery, SearchRecipesQuery } from './queries/recipes/RecipeQueries.js';
import { GetRecipesQueryHandler } from './queries/recipes/RecipeQueryHandlers.js';

const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;

function makeTokens(user: User, jwtService: IJwtService): { tokens: AuthTokensDto; tokenHash: string } {
  const refreshToken = jwtService.generateRefreshToken();
  const tokenHash = jwtService.verifyRefreshToken(refreshToken);
  if (!tokenHash) throw new UnauthorizedError('Could not create refresh token');

  return {
    tokenHash,
    tokens: {
      accessToken: jwtService.generateAccessToken({
        userId: user.id,
        email: user.email.getValue(),
        roles: [user.role],
        jti: randomUUID(),
      }),
      refreshToken,
      expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
    },
  };
}

async function persistTokens(
  prisma: PrismaClient,
  user: User,
  jwtService: IJwtService,
): Promise<AuthTokensDto> {
  const { tokens, tokenHash } = makeTokens(user, jwtService);
  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS),
    },
  });
  return tokens;
}

function categoryDto(category: Category, recipeCount?: number) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug.getValue(),
    description: category.description,
    imageUrl: category.imageUrl,
    orderIndex: category.orderIndex,
    recipeCount,
    createdAt: category.createdAt,
  };
}

function recipeSummary(recipe: Recipe, categoryName?: string, authorName?: string) {
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
    categoryName: categoryName ?? recipe.categoryId,
    authorId: recipe.authorId,
    authorName: authorName ?? recipe.authorId,
    publishedAt: recipe.publishedAt,
    createdAt: recipe.createdAt,
  };
}

export function registerApiHandlers(
  commandBus: CommandBus,
  prisma: PrismaClient,
  jwtService: IJwtService,
  userRepository: IUserRepository,
  categoryRepository: ICategoryRepository,
  recipeRepository: IRecipeRepository,
): void {
  commandBus.registerCommandHandler<RegisterCommand, string>('RegisterCommand', {
    execute: async ({ input }) => {
      const email = EmailAddress.create(input.email);
      const existing = await prisma.user.findUnique({ where: { email: email.getValue() }, select: { id: true } });
      if (existing) throw new ConflictError('Email already exists');

      const user = User.create({
        email: input.email,
        displayName: input.displayName,
        passwordHash: await PasswordService.hash(input.password),
      });
      await userRepository.save(user);
      return user.id;
    },
  });

  commandBus.registerCommandHandler<LoginCommand, AuthTokensDto>('LoginCommand', {
    execute: async ({ input }) => {
      const user = await userRepository.findByEmail(EmailAddress.create(input.email));
      if (!user?.passwordHash || !user.isActive || user.isDeleted ||
        !(await PasswordService.verify(input.password, user.passwordHash))) {
        throw new UnauthorizedError('Invalid email or password');
      }
      return persistTokens(prisma, user, jwtService);
    },
  });

  commandBus.registerCommandHandler<GoogleAuthCommand, AuthTokensDto>('GoogleAuthCommand', {
    execute: async ({ input }) => {
      if (!env.GOOGLE_CLIENT_ID) throw new UnauthorizedError('Google sign-in is not configured');

      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`);
      if (!response.ok) throw new UnauthorizedError('Invalid Google ID token');
      const claims = await response.json() as { aud?: string; sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string };
      if (claims.aud !== env.GOOGLE_CLIENT_ID || !claims.sub || !claims.email ||
        !(claims.email_verified === true || claims.email_verified === 'true')) {
        throw new UnauthorizedError('Invalid Google ID token');
      }

      let user = await userRepository.findByGoogleId(claims.sub);
      if (!user) user = await userRepository.findByEmail(EmailAddress.create(claims.email));
      if (!user) {
        const existing = await prisma.user.findUnique({ where: { email: claims.email }, select: { isDeleted: true } });
        if (existing?.isDeleted) throw new UnauthorizedError('Account is inactive');
        user = User.create({
          email: claims.email,
          displayName: claims.name || claims.email.split('@')[0] || 'User',
          avatarUrl: claims.picture,
          googleId: claims.sub,
        });
        user.verifyEmail();
        user = await userRepository.save(user);
      }
      if (!user.isActive || user.isDeleted) throw new UnauthorizedError('Account is inactive');
      return persistTokens(prisma, user, jwtService);
    },
  });

  commandBus.registerCommandHandler<LogoutCommand, void>('LogoutCommand', {
    execute: async ({ refreshToken, userId }) => {
      const tokenHash = jwtService.verifyRefreshToken(refreshToken);
      if (!tokenHash) throw new UnauthorizedError('Invalid refresh token');
      const result = await prisma.refreshToken.updateMany({
        where: { tokenHash, userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      if (result.count === 0) throw new UnauthorizedError('Refresh token is invalid or already revoked');
    },
  });

  commandBus.registerCommandHandler<UpdateProfileCommand, UserDto>('UpdateProfileCommand', {
    execute: async ({ userId, input }) => {
      const user = await userRepository.findById(userId);
      if (!user) throw new NotFoundError('User');
      user.updateProfile(input);
      const saved = await userRepository.save(user);
      return {
        id: saved.id,
        email: saved.email.getValue(),
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl,
        bio: saved.bio,
        role: saved.role,
        emailVerified: saved.emailVerified,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
      };
    },
  });

  commandBus.registerCommandHandler<CreateCategoryCommand, string>('CreateCategoryCommand', {
    execute: async ({ input }) => {
      const slug = Slug.create(input.name).getValue();
      const duplicate = await prisma.category.findFirst({ where: { OR: [{ name: input.name }, { slug }] }, select: { id: true } });
      if (duplicate) throw new ConflictError('Category name already exists');
      const category = Category.create({
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        orderIndex: input.orderIndex ?? 0,
      });
      await categoryRepository.save(category);
      return category.id;
    },
  });

  commandBus.registerCommandHandler<UpdateCategoryCommand, void>('UpdateCategoryCommand', {
    execute: async ({ categoryId, input }) => {
      const category = await categoryRepository.findById(categoryId);
      if (!category) throw new NotFoundError('Category');
      if (input.name && input.name !== category.name) {
        const slug = Slug.create(input.name).getValue();
        const duplicate = await prisma.category.findFirst({
          where: { id: { not: categoryId }, OR: [{ name: input.name }, { slug }] },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError('Category name or slug already exists');
      }
      category.update(input);
      await categoryRepository.save(category);
    },
  });

  commandBus.registerCommandHandler<DeleteCategoryCommand, void>('DeleteCategoryCommand', {
    execute: async ({ categoryId }) => {
      const category = await categoryRepository.findById(categoryId);
      if (!category) throw new NotFoundError('Category');
      const recipeCount = await prisma.recipe.count({ where: { categoryId, isDeleted: false } });
      if (recipeCount > 0) throw new ConflictError('Category has recipes and cannot be deleted');
      category.softDelete();
      await categoryRepository.save(category);
    },
  });

  commandBus.registerCommandHandler<CreateRecipeCommand, string>('CreateRecipeCommand', {
    execute: async ({ authorId, input }) => {
      const slug = Slug.create(input.title).getValue();
      const duplicate = await prisma.recipe.findUnique({ where: { slug }, select: { id: true } });
      if (duplicate) throw new ConflictError('A recipe with this title already exists');
      const recipe = Recipe.create({
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        prepTime: input.prepTime,
        cookTime: input.cookTime,
        servings: input.servings,
        difficulty: input.difficulty,
        categoryId: input.categoryId,
        authorId,
        nutrition: input.nutrition,
      });
      const props = recipe.toPersistence();
      await prisma.$transaction(async (transaction) => {
        await transaction.recipe.create({
          data: {
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
          },
        });
        if (input.steps?.length) {
          await transaction.recipeStep.createMany({ data: input.steps.map(step => ({ ...step, recipeId: recipe.id })) });
        }
        if (input.ingredients?.length) {
          await transaction.recipeIngredient.createMany({ data: input.ingredients.map(ingredient => ({ ...ingredient, recipeId: recipe.id })) });
        }
      });
      return recipe.id;
    },
  });

  commandBus.registerCommandHandler<UpdateRecipeCommand, void>('UpdateRecipeCommand', {
    execute: async ({ recipeId, input, expectedVersion }) => {
      const existing = await prisma.recipe.findFirst({ where: { id: recipeId, isDeleted: false } });
      if (!existing) throw new NotFoundError('Recipe');
      if (expectedVersion > 0 && existing.version !== expectedVersion) throw new ConflictError('Recipe has changed; reload and try again');
      const nutrition = input.nutrition;
      const slug = input.title === undefined ? undefined : Slug.create(input.title).getValue();
      if (slug && slug !== existing.slug) {
        const duplicate = await prisma.recipe.findFirst({ where: { slug, id: { not: recipeId } }, select: { id: true } });
        if (duplicate) throw new ConflictError('A recipe with this title already exists');
      }
      const data: Prisma.RecipeUpdateManyMutationInput = {
        ...input,
        ...(slug ? { slug } : {}),
        ...(nutrition ? {
          nutritionCalories: nutrition.calories,
          nutritionProtein: nutrition.protein,
          nutritionCarbohydrates: nutrition.carbohydrates,
          nutritionFat: nutrition.fat,
          nutritionFiber: nutrition.fiber,
          nutritionSodium: nutrition.sodium,
        } : {}),
        version: { increment: 1 },
      };
      delete (data as Record<string, unknown>).nutrition;
      const result = await prisma.recipe.updateMany({
        where: { id: recipeId, isDeleted: false, ...(expectedVersion > 0 ? { version: expectedVersion } : {}) },
        data,
      });
      if (!result.count) throw new ConflictError('Recipe has changed; reload and try again');
    },
  });

  const updateRecipeStatus = async (recipeId: string, status: RecipeStatus, publish: boolean): Promise<void> => {
    const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, isDeleted: false } });
    if (!recipe) throw new NotFoundError('Recipe');
    if (publish && recipe.status !== RecipeStatus.DRAFT) throw new ConflictError('Only draft recipes can be published');
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status,
        publishedAt: status === RecipeStatus.PUBLISHED ? new Date() : null,
        version: { increment: 1 },
      },
    });
  };

  commandBus.registerCommandHandler<PublishRecipeCommand, void>('PublishRecipeCommand', {
    execute: ({ recipeId }) => updateRecipeStatus(recipeId, RecipeStatus.PUBLISHED, true),
  });
  commandBus.registerCommandHandler<UnpublishRecipeCommand, void>('UnpublishRecipeCommand', {
    execute: ({ recipeId }) => updateRecipeStatus(recipeId, RecipeStatus.DRAFT, false),
  });
  commandBus.registerCommandHandler<ArchiveRecipeCommand, void>('ArchiveRecipeCommand', {
    execute: ({ recipeId }) => updateRecipeStatus(recipeId, RecipeStatus.ARCHIVED, false),
  });
  commandBus.registerCommandHandler<DeleteRecipeCommand, void>('DeleteRecipeCommand', {
    execute: async ({ recipeId }) => {
      const result = await prisma.recipe.updateMany({
        where: { id: recipeId, isDeleted: false },
        data: { isDeleted: true, version: { increment: 1 } },
      });
      if (!result.count) throw new NotFoundError('Recipe');
    },
  });

  commandBus.registerCommandHandler<AddRecipeStepCommand, string>('AddRecipeStepCommand', {
    execute: async ({ recipeId, stepNumber, title, description, timerMinutes, imageUrl }) => {
      const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, isDeleted: false }, select: { id: true } });
      if (!recipe) throw new NotFoundError('Recipe');
      const duplicate = await prisma.recipeStep.findFirst({ where: { recipeId, stepNumber }, select: { id: true } });
      if (duplicate) throw new ConflictError('A step with this number already exists');
      const step = await prisma.recipeStep.create({
        data: { recipeId, stepNumber, title, description, timerMinutes, imageUrl },
      });
      return step.id;
    },
  });
  commandBus.registerCommandHandler<UpdateRecipeStepCommand, void>('UpdateRecipeStepCommand', {
    execute: async ({ recipeId, stepId, stepNumber, title, description, timerMinutes, imageUrl }) => {
      if (stepNumber !== undefined) {
        const duplicate = await prisma.recipeStep.findFirst({
          where: { recipeId, stepNumber, id: { not: stepId } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError('A step with this number already exists');
      }
      const result = await prisma.recipeStep.updateMany({
        where: { id: stepId, recipeId, isDeleted: false },
        data: { stepNumber, title, description, timerMinutes, imageUrl, version: { increment: 1 } },
      });
      if (!result.count) throw new NotFoundError('Recipe step');
    },
  });
  commandBus.registerCommandHandler<DeleteRecipeStepCommand, void>('DeleteRecipeStepCommand', {
    execute: async ({ recipeId, stepId }) => {
      const result = await prisma.recipeStep.updateMany({
        where: { id: stepId, recipeId, isDeleted: false },
        data: { isDeleted: true, version: { increment: 1 } },
      });
      if (!result.count) throw new NotFoundError('Recipe step');
    },
  });

  commandBus.registerCommandHandler<AddRecipeIngredientCommand, string>('AddRecipeIngredientCommand', {
    execute: async ({ recipeId, name, quantity, unit, notes, orderIndex }) => {
      const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, isDeleted: false }, select: { id: true } });
      if (!recipe) throw new NotFoundError('Recipe');
      const ingredient = await prisma.recipeIngredient.create({ data: { recipeId, name, quantity, unit, notes, orderIndex } });
      return ingredient.id;
    },
  });
  commandBus.registerCommandHandler<UpdateRecipeIngredientCommand, void>('UpdateRecipeIngredientCommand', {
    execute: async ({ recipeId, ingredientId, name, quantity, unit, notes, orderIndex }) => {
      const result = await prisma.recipeIngredient.updateMany({
        where: { id: ingredientId, recipeId, isDeleted: false },
        data: { name, quantity, unit, notes, orderIndex, version: { increment: 1 } },
      });
      if (!result.count) throw new NotFoundError('Recipe ingredient');
    },
  });
  commandBus.registerCommandHandler<DeleteRecipeIngredientCommand, void>('DeleteRecipeIngredientCommand', {
    execute: async ({ recipeId, ingredientId }) => {
      const result = await prisma.recipeIngredient.updateMany({
        where: { id: ingredientId, recipeId, isDeleted: false },
        data: { isDeleted: true, version: { increment: 1 } },
      });
      if (!result.count) throw new NotFoundError('Recipe ingredient');
    },
  });

  commandBus.registerQueryHandler<GetCurrentUserQuery, UserDto | null>('GetCurrentUserQuery', {
    execute: async ({ userId }) => {
      const user = await userRepository.findById(userId);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email.getValue(),
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    },
  });

  commandBus.registerQueryHandler('GetRecipesQuery', new GetRecipesQueryHandler(recipeRepository));

  commandBus.registerQueryHandler<GetCategoriesQuery, PagedResult<CategoryDto>>('GetCategoriesQuery', {
    execute: query => categoryRepository.findMany(query.filters, query.page, query.pageSize) as unknown as Promise<PagedResult<CategoryDto>>,
  });
  commandBus.registerQueryHandler<GetCategoryBySlugQuery, CategoryDetailDto | null>('GetCategoryBySlugQuery', {
    execute: async ({ slug, page, pageSize, userId, userRole }) => {
      const category = await categoryRepository.findBySlug(slug);
      if (!category) return null;
      const recipes = await recipeRepository.findMany(
        { categoryId: category.id, visibility: { role: (userRole as UserRole) ?? UserRole.GUEST, userId } },
        { field: 'createdAt', order: 'desc' },
        page,
        pageSize,
      );
      const count = await prisma.recipe.count({ where: { categoryId: category.id, status: 'PUBLISHED', isDeleted: false } });
      return { ...categoryDto(category, count), recipes: recipes as unknown as PagedResult<RecipeSummaryDto> };
    },
  });
  commandBus.registerQueryHandler<GetRecipeBySlugQuery, RecipeDetailDto | null>('GetRecipeBySlugQuery', {
    execute: async ({ slug, userId, userRole }) => {
      const recipe = await prisma.recipe.findFirst({
        where: {
          slug,
          isDeleted: false,
          ...(userRole === UserRole.ADMIN ? {} : {
            OR: [
              { status: 'PUBLISHED' },
              ...(userId && userRole === UserRole.AUTHOR ? [{ authorId: userId }] : []),
            ],
          }),
        },
        include: {
          author: { select: { displayName: true } },
          category: { select: { name: true } },
          steps: { where: { isDeleted: false }, orderBy: { stepNumber: 'asc' } },
          ingredients: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
          images: { where: { isDeleted: false }, orderBy: { orderIndex: 'asc' } },
        },
      });
      if (!recipe) return null;
      return {
        ...recipeSummary(Recipe.reconstruct({
          id: recipe.id,
          title: recipe.title,
          slug: Slug.fromExisting(recipe.slug),
          description: recipe.description,
          instructions: recipe.instructions ?? undefined,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty as RecipeDifficulty,
          status: recipe.status as RecipeStatus,
          categoryId: recipe.categoryId,
          authorId: recipe.authorId,
          nutrition: {
            calories: recipe.nutritionCalories ? Number(recipe.nutritionCalories) : undefined,
            protein: recipe.nutritionProtein ? Number(recipe.nutritionProtein) : undefined,
            carbohydrates: recipe.nutritionCarbohydrates ? Number(recipe.nutritionCarbohydrates) : undefined,
            fat: recipe.nutritionFat ? Number(recipe.nutritionFat) : undefined,
            fiber: recipe.nutritionFiber ? Number(recipe.nutritionFiber) : undefined,
            sodium: recipe.nutritionSodium ? Number(recipe.nutritionSodium) : undefined,
          },
          publishedAt: recipe.publishedAt ?? undefined,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
          isDeleted: recipe.isDeleted,
          version: recipe.version,
        }), recipe.category.name, recipe.author.displayName),
        instructions: recipe.instructions ?? undefined,
        nutrition: {
          calories: recipe.nutritionCalories ? Number(recipe.nutritionCalories) : undefined,
          protein: recipe.nutritionProtein ? Number(recipe.nutritionProtein) : undefined,
          carbohydrates: recipe.nutritionCarbohydrates ? Number(recipe.nutritionCarbohydrates) : undefined,
          fat: recipe.nutritionFat ? Number(recipe.nutritionFat) : undefined,
          fiber: recipe.nutritionFiber ? Number(recipe.nutritionFiber) : undefined,
          sodium: recipe.nutritionSodium ? Number(recipe.nutritionSodium) : undefined,
        },
        steps: recipe.steps.map(step => ({
          id: step.id,
          stepNumber: step.stepNumber,
          title: step.title,
          description: step.description,
          timerMinutes: step.timerMinutes ?? undefined,
          imageUrl: step.imageUrl ?? undefined,
        })),
        ingredients: recipe.ingredients.map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity === null ? undefined : Number(ingredient.quantity),
          unit: ingredient.unit ?? undefined,
          notes: ingredient.notes ?? undefined,
          orderIndex: ingredient.orderIndex,
        })),
        images: recipe.images.map(image => ({
          id: image.id,
          originalUrl: image.originalUrl,
          mediumUrl: image.mediumUrl ?? undefined,
          thumbnailUrl: image.thumbnailUrl ?? undefined,
          altText: image.altText ?? undefined,
          isPrimary: image.isPrimary,
          orderIndex: image.orderIndex,
        })),
      };
    },
  });
  commandBus.registerQueryHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>>('SearchRecipesQuery', {
    execute: query => recipeRepository.search(
      query.query,
      { ...query.filters, visibility: { role: UserRole.GUEST } },
      query.sort,
      query.page,
      query.pageSize,
    ) as unknown as Promise<PagedResult<RecipeSummaryDto>>,
  });
}
