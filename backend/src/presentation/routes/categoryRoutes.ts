import { Router } from 'express';
import { z } from 'zod';

import { commandBus } from '../../application/command-bus.js';
import { 
  CreateCategoryCommand, 
  UpdateCategoryCommand, 
  DeleteCategoryCommand 
} from '../../application/commands/categories/CategoryCommands.js';
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
import { UserRole } from '../../domain/enums/UserRole.js';
import { authenticateJwt, AuthenticatedRequest, authorize } from '../middleware/AuthMiddleware.js';
import { generalRateLimiter } from '../middleware/RateLimitMiddleware.js';

const router = Router();

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

router.get('/:slug', generalRateLimiter, async (req, res, next) => {
  try {
    const paginationSchema = z.object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(50).default(12),
    });
    
    const pagination = paginationSchema.parse(req.query);

    const query = new GetCategoryBySlugQuery(
      req.params.slug!,
      pagination.page,
      pagination.pageSize,
      (req as AuthenticatedRequest).user?.id,
      (req as AuthenticatedRequest).user?.roles[0]
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
    const categoryId = await commandBus.executeCommand(command);
    res.status(201).json({ id: categoryId, message: 'Category created successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateJwt, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const input = updateCategorySchema.parse(req.body);
    const command = new UpdateCategoryCommand(req.params.id!, input);
    await commandBus.executeCommand(command);
    res.json({ message: 'Category updated successfully' });
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