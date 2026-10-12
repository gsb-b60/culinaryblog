import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';

import { commandBus } from '../../application/command-bus.js';
import { 
  CreateRecipeCommand, 
  UpdateRecipeCommand, 
  PublishRecipeCommand,
  UnpublishRecipeCommand,
  ArchiveRecipeCommand,
  DeleteRecipeCommand,
  AddRecipeStepCommand,
  UpdateRecipeStepCommand,
  DeleteRecipeStepCommand,
  AddRecipeIngredientCommand,
  UpdateRecipeIngredientCommand,
  DeleteRecipeIngredientCommand,
} from '../../application/commands/recipes/RecipeCommands.js';
import { 
  GetManageableRecipesQuery,
  GetRecipesQuery, 
  GetRecipeBySlugQuery, 
  SearchRecipesQuery 
} from '../../application/queries/recipes/RecipeQueries.js';
import { 
  createRecipeSchema, 
  updateRecipeSchema,
  recipeFiltersSchema,
  recipeSortSchema,
  paginationSchema 
} from '../../application/validators/recipeValidators.js';
import { UserRole } from '../../domain/index.js';
import { authenticateJwt, optionalAuth, AuthenticatedRequest, authorizeOwnerOrAdmin } from '../middleware/AuthMiddleware.js';
import { generalRateLimiter } from '../middleware/RateLimitMiddleware.js';

// Explicit annotation avoids TS2742 when emitting declarations on CI.
const router: RouterType = Router();

// Public routes
router.get('/', generalRateLimiter, async (req, res, next) => {
  try {
    const filters = recipeFiltersSchema.parse(req.query);
    const sort = recipeSortSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const query = new GetRecipesQuery(
      filters,
      sort,
      pagination.page,
      pagination.pageSize
    );
    const result = await commandBus.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/search', generalRateLimiter, async (req, res, next) => {
  try {
    const searchSchema = z.object({
      q: z.string().min(2),
    }).merge(recipeFiltersSchema).merge(recipeSortSchema).merge(paginationSchema);

    const input = searchSchema.parse(req.query);
    
    const { q, field, order, page, pageSize, ...filters } = input;

    const sortObj = { field: field || 'createdAt', order: order || 'desc' };

    const query = new SearchRecipesQuery(
      q,
      filters,
      sortObj,
      page,
      pageSize
    );
    const result = await commandBus.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Management route must precede /:slug. Author scope comes from the JWT, never from query parameters.
router.get('/manageable', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = recipeFiltersSchema.parse(req.query);
    const sort = recipeSortSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const result = await commandBus.executeQuery(new GetManageableRecipesQuery(
      filters, sort, pagination.page, pagination.pageSize,
      req.user!.id, req.user!.roles.includes(UserRole.ADMIN),
    ));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', generalRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const query = new GetRecipeBySlugQuery(
      req.params.slug!,
      (req as AuthenticatedRequest).user?.id,
      (req as AuthenticatedRequest).user?.roles.includes(UserRole.ADMIN) ? UserRole.ADMIN : (req as AuthenticatedRequest).user?.roles[0]
    );
    const recipe = await commandBus.executeQuery(query);
    
    if (!recipe) {
      res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Not Found',
        status: 404,
        detail: 'Recipe not found',
      });
      return;
    }

    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

// Protected routes
router.post('/', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = createRecipeSchema.parse(req.body);
    const command = new CreateRecipeCommand(req.user!.id, input);
    const recipeId = await commandBus.executeCommand(command);
    res.status(201).json({ id: recipeId, message: 'Recipe created successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = updateRecipeSchema.parse(req.body);
    const expectedVersion = parseInt(req.headers['if-match'] as string || '0');
    const command = new UpdateRecipeCommand(req.params.id!, req.user!.id, input, expectedVersion);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/publish', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new PublishRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe published successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/unpublish', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new UnpublishRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe unpublished successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const recipeId = z.string().uuid().parse(req.params.id);
    const command = new ArchiveRecipeCommand(recipeId, req.user!.id, req.user!.roles.includes(UserRole.ADMIN));
    await commandBus.executeCommand(command);
    res.status(200).json({ id: recipeId, status: 'ARCHIVED', message: 'Recipe archived successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Recipe Steps
router.post('/:id/steps', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const stepSchema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      timerMinutes: z.number().int().nonnegative().optional(),
      imageUrl: z.string().url().max(500).optional(),
    });
    
    const input = stepSchema.parse(req.body);
    const command = new AddRecipeStepCommand(
      req.params.id!,
      req.user!.id,
      input.title,
      input.description,
      input.timerMinutes,
      input.imageUrl
    );
    const stepId = await commandBus.executeCommand(command);
    res.status(201).json({ id: stepId, message: 'Step added successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/steps/:stepId', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const stepSchema = z.object({
      stepNumber: z.number().int().positive().optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).optional(),
      timerMinutes: z.number().int().nonnegative().optional(),
      imageUrl: z.string().url().max(500).optional(),
    });
    
    const input = stepSchema.parse(req.body);
    const command = new UpdateRecipeStepCommand(
      req.params.id!,
      req.user!.id,
      req.params.stepId!,
      input.stepNumber,
      input.title,
      input.description,
      input.timerMinutes,
      input.imageUrl
    );
    await commandBus.executeCommand(command);
    res.json({ message: 'Step updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/steps/:stepId', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeStepCommand(req.params.id!, req.user!.id, req.params.stepId!);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Recipe Ingredients
router.post('/:id/ingredients', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const ingredientSchema = z.object({
      name: z.string().min(1).max(200),
      quantity: z.number().positive().max(999999.999).optional(),
      unit: z.string().max(50).optional(),
      notes: z.string().max(500).optional(),
      orderIndex: z.number().int().nonnegative().default(0),
    });
    
    const input = ingredientSchema.parse(req.body);
    const command = new AddRecipeIngredientCommand(
      req.params.id!,
      req.user!.id,
      input.name,
      input.quantity,
      input.unit,
      input.notes,
      input.orderIndex,
      req.user!.roles.includes(UserRole.ADMIN)
    );
    const ingredient = await commandBus.executeCommand(command);
    res.status(201).json(ingredient);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/ingredients/:ingredientId', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const ingredientSchema = z.object({
      name: z.string().min(1).max(200).optional(),
      quantity: z.number().positive().max(999999.999).optional(),
      unit: z.string().max(50).optional(),
      notes: z.string().max(500).optional(),
      orderIndex: z.number().int().nonnegative().optional(),
    });
    
    const input = ingredientSchema.parse(req.body);
    const command = new UpdateRecipeIngredientCommand(
      req.params.id!,
      req.user!.id,
      req.params.ingredientId!,
      input.name,
      input.quantity,
      input.unit,
      input.notes,
      input.orderIndex,
      req.user!.roles.includes(UserRole.ADMIN)
    );
    const ingredient = await commandBus.executeCommand(command);
    res.json(ingredient);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/ingredients/:ingredientId', authenticateJwt, authorizeOwnerOrAdmin(async (req) => req.params.id!), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeIngredientCommand(
      req.params.id!,
      req.user!.id,
      req.params.ingredientId!,
      req.user!.roles.includes(UserRole.ADMIN),
    );
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;