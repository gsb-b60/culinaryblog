import { Express, RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LetHimCook API',
    version: '1.0.0',
    description: 'Versioned REST API for the LetHimCook culinary blog.',
  },
  servers: [{ url: API_PREFIX, description: 'Current API version' }],
  tags: [
    { name: 'Authentication' },
    { name: 'Recipes' },
    { name: 'Categories' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Problem: {
        type: 'object',
        properties: {
          type: { type: 'string', format: 'uri' },
          title: { type: 'string' },
          status: { type: 'integer' },
          detail: { type: 'string' },
        },
        required: ['title', 'status'],
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer' },
        },
        required: ['accessToken', 'refreshToken', 'expiresIn'],
      },
      PagedResult: {
        type: 'object',
        properties: {
          items: { type: 'array', items: {} },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
              totalCount: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNextPage: { type: 'boolean' },
              hasPreviousPage: { type: 'boolean' },
            },
            required: ['page', 'pageSize', 'totalCount', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
          },
        },
        required: ['items', 'meta'],
      },
      Recipe: {
        type: 'object',
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
          categoryName: { type: 'string' },
          authorId: { type: 'string', format: 'uuid' },
          authorName: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'slug', 'description', 'prepTime', 'cookTime', 'servings', 'difficulty', 'status', 'categoryId', 'authorId', 'createdAt'],
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri' },
          orderIndex: { type: 'integer' },
          recipeCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'slug', 'orderIndex', 'createdAt'],
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register an account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  displayName: { type: 'string', minLength: 2, maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Problem' } } } },
          '429': { description: 'Authentication rate limit exceeded' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'JWT access and refresh tokens', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Authentication rate limit exceeded' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate refresh token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'New token pair', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate using a Google ID token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['idToken'], properties: { idToken: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'JWT access and refresh tokens', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } }, '401': { description: 'Invalid Google token' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Current user profile' }, '401': { description: 'Authentication required' } },
      },
      patch: {
        tags: ['Authentication'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { displayName: { type: 'string' }, avatarUrl: { type: 'string', format: 'uri' }, bio: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Updated profile' }, '401': { description: 'Authentication required' } },
      },
    },
    '/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'List published recipes',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { '200': { description: 'Paginated recipes', content: { 'application/json': { schema: { $ref: '#/components/schemas/PagedResult' } } } } },
      },
      post: {
        tags: ['Recipes'],
        summary: 'Create a recipe (AUTHOR or ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'categoryId', 'prepTime', 'cookTime', 'servings', 'difficulty'],
                properties: {
                  title: { type: 'string' }, description: { type: 'string' }, categoryId: { type: 'string', format: 'uuid' },
                  prepTime: { type: 'integer' }, cookTime: { type: 'integer' }, servings: { type: 'integer' },
                  difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] }, instructions: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Recipe created' }, '401': { description: 'Authentication required' }, '403': { description: 'AUTHOR or ADMIN role required' } },
      },
    },
    '/recipes/search': {
      get: {
        tags: ['Recipes'],
        summary: 'Search recipes',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } },
        ],
        responses: { '200': { description: 'Paginated search results' }, '400': { description: 'Invalid search query' } },
      },
    },
    '/recipes/{slug}': {
      get: {
        tags: ['Recipes'],
        summary: 'Get recipe details',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Recipe details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Recipe' } } } },
          '404': { description: 'Recipe not found' },
        },
      },
    },
    '/recipes/{id}': {
      put: {
        tags: ['Recipes'],
        summary: 'Update an owned recipe (AUTHOR or ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'If-Match', in: 'header', schema: { type: 'integer' }, description: 'Expected entity version for optimistic concurrency' },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } } } },
        responses: { '200': { description: 'Recipe updated' }, '401': { description: 'Authentication required' }, '403': { description: 'Not the owner or admin' } },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'Delete an owned recipe (AUTHOR or ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Recipe deleted' }, '401': { description: 'Authentication required' }, '403': { description: 'Not the owner or admin' } },
      },
    },
    '/recipes/{id}/images': {
      post: {
        tags: ['Recipes'],
        summary: 'Upload recipe image (AUTHOR or ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' }, altText: { type: 'string' }, isPrimary: { type: 'boolean' } } } } },
        },
        responses: { '201': { description: 'Image uploaded' }, '413': { description: 'Image exceeds the 5 MB upload limit' }, '429': { description: 'Upload rate limit exceeded' } },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } }, { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 } }],
        responses: { '200': { description: 'Paginated categories', content: { 'application/json': { schema: { $ref: '#/components/schemas/PagedResult' } } } } },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category (ADMIN)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' }, imageUrl: { type: 'string', format: 'uri' }, orderIndex: { type: 'integer' } } } } },
        },
        responses: { '201': { description: 'Category created' }, '403': { description: 'ADMIN role required' } },
      },
    },
    '/categories/{slug}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category and recipes',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Category details and paginated recipes' }, '404': { description: 'Category not found' } },
      },
    },
  },
} as const;

export function setupOpenAPI(app: Express): void {
  app.get('/api-docs.json', (_req, res) => res.json(openApiSpec));
  const docsCspMiddleware: RequestHandler = (_req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  };
  app.use(
    '/api-docs',
    docsCspMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec),
  );
}