import { NextFunction, Request, Response, Router } from 'express';
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
import { authenticateJwt, AuthenticatedRequest, authorize } from '../middleware/AuthMiddleware.js';
import { generalRateLimiter } from '../middleware/RateLimitMiddleware.js';
import { 
  createCategorySchema, 
  updateCategorySchema
} from '../../application/validators/categoryValidators.js';
import { UserRole } from '../../domain/enums/UserRole.js';
import { EntityNotFoundException } from '../../domain/exceptions/DomainException.js';
import { z } from 'zod';

const router = Router();
export const categoryListRoutes = Router();

const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const query = new GetCategoriesQuery();
    const result = await commandBus.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Public routes
router.get('/', generalRateLimiter, getCategories);
categoryListRoutes.get('/', generalRateLimiter, getCategories);

const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paginationSchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(50).default(12),
    });
    
    const pagination = paginationSchema.parse(req.query);

    const query = new GetCategoryBySlugQuery(
      req.params.slug,
      pagination.page,
      pagination.pageSize,
      (req as AuthenticatedRequest).user?.id,
      (req as AuthenticatedRequest).user?.roles[0]
    );
    const result = await commandBus.executeQuery(query);
    
    if (!result) {
      throw new EntityNotFoundException('Category', req.params.slug);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

router.get('/:slug', generalRateLimiter, getCategoryBySlug);
categoryListRoutes.get('/:slug', generalRateLimiter, getCategoryBySlug);

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
    const command = new UpdateCategoryCommand(req.params.id, input);
    await commandBus.executeCommand(command);
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJwt, authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const command = new DeleteCategoryCommand(req.params.id);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;