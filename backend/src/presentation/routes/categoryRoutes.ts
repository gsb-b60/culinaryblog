import { Router, type Router as RouterType } from 'express';


import { commandBus } from '../../application/command-bus.js';
import { 
  CreateCategoryCommand, 
  UpdateCategoryCommand, 
  DeleteCategoryCommand 
} from '../../application/commands/categories/CategoryCommands.js';
import { CategoryDto } from '../../application/dtos/CategoryDto.js';
import { 
  GetCategoriesQuery, 
  GetCategoryBySlugQuery 
} from '../../application/queries/categories/CategoryQueries.js';
import { 
  createCategorySchema, 
  updateCategorySchema,
  categoryFiltersSchema,
  categoryPaginationSchema 
} from '../../application/validators/categoryValidators.js';
import { paginationSchema } from '../../application/validators/paginationValidators.js';
import { UserRole } from '../../domain/enums/UserRole.js';
import {
  authenticateJwt,
  AuthenticatedRequest,
  authorize,
  optionalAuth,
} from '../middleware/AuthMiddleware.js';
import { generalRateLimiter } from '../middleware/RateLimitMiddleware.js';

// Explicit annotation avoids TS2742 when emitting declarations on CI.
const router: RouterType = Router();
export const categoryListRoutes: RouterType = router;

// Public routes
router.get('/', generalRateLimiter, async (req, res, next) => {
  try {
    const filters = categoryFiltersSchema.parse(req.query);
    const pagination = categoryPaginationSchema.parse(req.query);

    const query = new GetCategoriesQuery(
      filters,
      pagination.page,
      pagination.pageSize
    );
    const result = await commandBus.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', generalRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const pagination = paginationSchema.parse(req.query);

    // Optionally read the user from JWT if present (no hard auth requirement)
    const authReq = req as AuthenticatedRequest;

    const query = new GetCategoryBySlugQuery(
      req.params.slug!,
      pagination.page,
      pagination.pageSize,
      authReq.user?.id,
      authReq.user?.roles[0]
    );
    const result = await commandBus.executeQuery(query);
    
    if (!result) {
      res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Not Found',
        status: 404,
        detail: 'Category not found',
      });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.post('/', authenticateJwt, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const input = createCategorySchema.parse(req.body);
    const command = new CreateCategoryCommand(input);
    const category = await commandBus.executeCommand<CreateCategoryCommand, CategoryDto>(command);
    res.setHeader('Location', `/api/v1/categories/${category.slug}`);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateJwt, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const input = updateCategorySchema.parse(req.body);
    const command = new UpdateCategoryCommand(req.params.id!, input);
    const category = await commandBus.executeCommand<UpdateCategoryCommand, CategoryDto>(command);
    res.json({ message: 'Category updated successfully', ...category });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJwt, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const command = new DeleteCategoryCommand(req.params.id!);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
