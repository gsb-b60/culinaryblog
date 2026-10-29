import type { Express, Router } from 'express';

const problemDetails = {
  type: 'object',
  properties: {
    type: { type: 'string', example: 'about:blank' },
    title: { type: 'string', example: 'Not Found' },
    status: { type: 'integer', example: 404 },
    detail: { type: 'string', example: 'Route not found' },
    errors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
  },
};

const ingredientFields = {
  name: { type: 'string', minLength: 1, maxLength: 200, example: 'Gạo' },
  quantity: {
    type: 'number',
    exclusiveMinimum: true,
    minimum: 0,
    maximum: 999999.999,
    example: 2.5,
  },
  unit: { type: 'string', maxLength: 50, example: 'kg' },
  notes: { type: 'string', maxLength: 500, example: 'Vo sạch' },
  orderIndex: { type: 'integer', minimum: 0, example: 0 },
};
const ingredientErrors = {
  '401': { description: 'Authentication required' },
  '403': { description: 'Not recipe owner/Admin' },
  '404': { description: 'Recipe or ingredient not found' },
  '422': { description: 'Invalid ingredient input' },
};
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LetHimCook API',
    version: '1.0.0',
    description:
      'Culinary Blog REST API. Base URL is /api/v1. Auth is Bearer JWT. Errors follow RFC 7807 Problem Details.',
  },
  servers: [{ url: '/api/v1', description: 'Version 1 (current)' }],
  tags: [
    { name: 'auth', description: 'Registration, login, OAuth, tokens, profile' },
    { name: 'categories', description: 'Recipe categories (Admin write)' },
    { name: 'recipes', description: 'Recipes, steps, ingredients, images' },
    { name: 'health', description: 'Liveness / readiness probes' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ProblemDetails: problemDetails,
      AuthResponse: {
        type: 'object',
        required: ['accessToken', 'refreshToken', 'expiresAt', 'user'],
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      AuthUser: {
        type: 'object',
        required: ['id', 'fullName', 'email', 'userName', 'roles'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          userName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          roles: { type: 'array', items: { type: 'string', enum: ['GUEST', 'AUTHOR', 'ADMIN'] } },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          role: { type: 'string' },
          emailVerified: { type: 'boolean' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['fullName', 'email', 'userName', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email', maxLength: 256 },
          userName: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1, maxLength: 128 },
        },
      },
      Category: {
        type: 'object',
        required: ['id', 'name', 'slug', 'orderIndex', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          orderIndex: { type: 'integer' },
          recipeCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RecipeSummary: {
        type: 'object',
        required: ['id', 'title', 'slug', 'status', 'difficulty'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          prepTime: { type: 'integer' },
          cookTime: { type: 'integer' },
          servings: { type: 'integer' },
          difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          categoryId: { type: 'string', format: 'uuid' },
          authorId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RecipeDetail: {
        allOf: [
          { $ref: '#/components/schemas/RecipeSummary' },
          {
            type: 'object',
            properties: {
              instructions: { type: 'string' },
              steps: { type: 'array', items: { $ref: '#/components/schemas/RecipeStep' } },
              ingredients: {
                type: 'array',
                items: { $ref: '#/components/schemas/RecipeIngredient' },
              },
              images: { type: 'array', items: { $ref: '#/components/schemas/RecipeImage' } },
            },
          },
        ],
      },
      RecipeStep: {
        type: 'object',
        required: ['id', 'stepNumber', 'title', 'description'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          stepNumber: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          timerMinutes: { type: 'integer', nullable: true },
          imageUrl: { type: 'string', nullable: true },
        },
      },
      RecipeIngredient: {
        type: 'object',
        required: ['id', 'name', 'orderIndex'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          quantity: { type: 'number', nullable: true },
          unit: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          orderIndex: { type: 'integer' },
        },
      },
      RecipeImage: {
        type: 'object',
        required: ['id', 'originalUrl', 'isPrimary', 'orderIndex'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          originalUrl: { type: 'string' },
          mediumUrl: { type: 'string', nullable: true },
          thumbnailUrl: { type: 'string', nullable: true },
          altText: { type: 'string', nullable: true },
          isPrimary: { type: 'boolean' },
          orderIndex: { type: 'integer' },
        },
      },
      PagedRecipes: {
        type: 'object',
        required: ['items', 'meta'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/RecipeSummary' } },
          meta: { $ref: '#/components/schemas/PageMeta' },
        },
      },
      PageMeta: {
        type: 'object',
        required: [
          'page',
          'pageSize',
          'totalCount',
          'totalPages',
          'hasNextPage',
          'hasPreviousPage',
        ],
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 12 },
          totalCount: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 9 },
          hasNextPage: { type: 'boolean' },
          hasPreviousPage: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Register a new account',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
          '429': {
            description: 'Rate limited',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['auth'],
        summary: 'Email/password login',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
          '403': {
            description: 'Disabled or locked',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['auth'],
        summary: 'Google ID-token login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: { idToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '400': {
            description: 'Invalid token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['auth'],
        summary: 'Rotate refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } },
            },
          },
          '401': {
            description: 'Expired/revoked',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['auth'],
        summary: 'Revoke refresh token',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { refreshToken: { type: 'string' } } },
            },
          },
        },
        responses: {
          '204': { description: 'No Content' },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['auth'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
      patch: {
        tags: ['auth'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  avatarUrl: { type: 'string' },
                  bio: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/auth/google/redirect': {
      get: {
        tags: ['auth'],
        summary: 'Start Google OAuth redirect flow',
        responses: {
          '302': { description: 'Redirect to Google' },
          '503': { description: 'Google not configured' },
        },
      },
    },
    '/auth/google/callback': {
      get: {
        tags: ['auth'],
        summary: 'Google OAuth callback',
        parameters: [
          { name: 'code', in: 'query', schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '302': { description: 'Redirect to frontend' },
          '400': { description: 'Bad state/code' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['categories'],
        summary: 'List categories',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['categories'],
        summary: 'Create category (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  imageUrl: { type: 'string' },
                  orderIndex: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '403': {
            description: 'Forbidden',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/categories/{slug}': {
      get: {
        tags: ['categories'],
        summary: 'Category detail + recipes',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK' },
          '404': {
            description: 'Not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/categories/{id}': {
      put: {
        tags: ['categories'],
        summary: 'Update category (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['categories'],
        summary: 'Delete category (Admin, only if empty)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'No Content' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
          '409': { description: 'Has recipes' },
        },
      },
    },
    '/recipes/manage/overview': {
      get: {
        tags: ['recipes'],
        summary: 'Account-scoped recipe statistics and five recently updated recipes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Statistics (total, published, draft, archived) and recentRecipes; Admin sees all, Author sees own' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/recipes': {
      get: {
        tags: ['recipes'],
        summary: 'List published recipes (paginated, filtered)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 12, maximum: 50 } },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'difficulty',
            in: 'query',
            schema: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PagedRecipes' } },
            },
          },
        },
      },
      post: {
        tags: ['recipes'],
        summary: 'Create recipe draft (Author/Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Created' },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
          '403': {
            description: 'Forbidden (GUEST)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/recipes/search': {
      get: {
        tags: ['recipes'],
        summary: 'Full-text search',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PagedRecipes' } },
            },
          },
        },
      },
    },
    '/recipes/{slug}': {
      get: {
        tags: ['recipes'],
        summary: 'Recipe detail by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RecipeDetail' } },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ProblemDetails' } },
            },
          },
        },
      },
    },
    '/recipes/{id}': {
      put: {
        tags: ['recipes'],
        summary: 'Update recipe (Owner/Admin, If-Match version)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'If-Match', in: 'header', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      delete: {
        tags: ['recipes'],
        summary: 'Permanently delete recipe (Owner/Admin); image cleanup is asynchronous',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'No Content' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Recipe not found' },
        },
      },
    },
    '/recipes/{id}/publish': {
      patch: {
        tags: ['recipes'],
        summary: 'Publish (Draft -> Published)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/recipes/{id}/unpublish': {
      patch: {
        tags: ['recipes'],
        summary: 'Unpublish (Published -> Draft)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/recipes/{id}/archive': {
      patch: {
        tags: ['recipes'],
        summary: 'Archive recipe (Owner/Admin; idempotent)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Archived recipe, including status, version and content', content: { 'application/json': { schema: { $ref: '#/components/schemas/RecipeDetail' } } } },
          '401': { description: 'Authentication required' },
          '403': { description: 'Only owner or Admin may archive' },
          '404': { description: 'Recipe not found or deleted' },
          '409': { description: 'Recipe changed; reload and retry' },
        },
      },
    },
    '/recipes/{id}/steps': {
      post: {
        tags: ['recipes'],
        summary: 'Add step (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '201': { description: 'Created' } },
      },
    },
    '/recipes/{id}/steps/{stepId}': {
      put: {
        tags: ['recipes'],
        summary: 'Update step',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            name: 'stepId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['recipes'],
        summary: 'Delete step',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            name: 'stepId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '204': { description: 'No Content' } },
      },
    },
    '/recipes/{id}/ingredients': {
      get: {
        tags: ['recipes'],
        summary: 'List recipe ingredients (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          ...ingredientErrors,
          '200': {
            description: 'Ingredients ordered by orderIndex',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/RecipeIngredient' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['recipes'],
        summary: 'Add ingredient (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name'], properties: ingredientFields },
            },
          },
        },
        responses: {
          ...ingredientErrors,
          '201': {
            description: 'Ingredient created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RecipeIngredient' } },
            },
          },
        },
      },
    },
    '/recipes/{id}/ingredients/{ingredientId}': {
      put: {
        tags: ['recipes'],
        summary: 'Update ingredient (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            name: 'ingredientId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object', properties: ingredientFields } },
          },
        },
        responses: {
          ...ingredientErrors,
          '200': {
            description: 'Ingredient updated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RecipeIngredient' } },
            },
          },
        },
      },
      delete: {
        tags: ['recipes'],
        summary: 'Delete ingredient (Owner/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            name: 'ingredientId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          ...ingredientErrors,
          '204': { description: 'Ingredient deleted; no response body' },
        },
      },
    },
  },
} as const;

const scalarHtml = `<!doctype html>
<html>
<head><title>LetHimCook API Reference</title><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body>
<script id="api-reference" data-url="/api-docs.json"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

/** Expose the OpenAPI JSON document and Scalar reference on Express. */
export function setupOpenAPI(app: Express | Router): void {
  (app as Router).get('/api-docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  (app as Router).get('/api-docs', (_req, res) => {
    res.json(openApiSpec);
  });
  (app as Router).get('/scalar', (_req, res) => {
    res.type('html').send(scalarHtml);
  });
}

// Legacy export kept for backwards-compat imports.
/** Register API reference routes on the supplied router. */
export function setupRoutes(app: Router): void {
  setupOpenAPI(app as unknown as Express);
}
