import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
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
import { GetRecipeIngredientsQuery } from '../../application/handlers/RecipeIngredientQueryHandler.js';
import { GetRecipeStepsQuery } from '../../application/handlers/RecipeStepCommandHandlers.js';
import { GetManagedRecipesQuery } from '../../application/queries/recipes/GetManagedRecipesQuery.js';
import { GetRecipeOverviewQuery } from '../../application/queries/recipes/GetRecipeOverviewQuery.js';
import {
  GetRecipesQuery,
  GetRecipeBySlugQuery,
  SearchRecipesQuery,
} from '../../application/queries/recipes/RecipeQueries.js';
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeFiltersSchema,
  recipeSortQuerySchema,
  paginationSchema,
} from '../../application/validators/recipeValidators.js';
import { AppError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { UserRole } from '../../domain/index.js';
import { getContainer } from '../di/container.js';
import { buildImageKey, assertImageSize, detectAllowedImage, MAX_IMAGE_SIZE_BYTES } from '../file-upload.js';
import {
  authenticateJwt,
  AuthenticatedRequest,
  authorize,
  optionalAuth,
} from '../middleware/AuthMiddleware.js';
import { uploadRateLimiter, generalRateLimiter } from '../middleware/RateLimitMiddleware.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

function uploadImageFile(req: Request, res: Response, next: NextFunction): void {
  imageUpload.single('file')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(
        400,
        'Image must be 5 MB or smaller.',
        'FILE_SIZE_EXCEEDED',
        { type: 'FILE_SIZE_EXCEEDED', title: 'File too large' },
      ));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}

// Explicit annotation avoids TS2742 when emitting declarations on CI.
const router: RouterType = Router();

// Authenticated overview scope comes exclusively from verified JWT claims.
router.get('/manage/overview', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json(
      await commandBus.executeQuery(
        new GetRecipeOverviewQuery(req.user!.id, req.user!.roles.includes(UserRole.ADMIN)),
      ),
    );
  } catch (error) {
    next(error);
  }
});

// Protected management list must precede the public /:slug route.
router.get('/manage', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = paginationSchema.parse(req.query);
    const query = new GetManagedRecipesQuery(
      req.user!.id,
      req.user!.roles.includes(UserRole.ADMIN),
      input.page,
      input.pageSize,
    );
    res.json(await commandBus.executeQuery(query));
  } catch (error) {
    next(error);
  }
});

// Public routes
router.get('/', generalRateLimiter, async (req, res, next) => {
  try {
    const filters = recipeFiltersSchema.parse(req.query);
    const sort = recipeSortQuerySchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const query = new GetRecipesQuery(filters, sort, pagination.page, pagination.pageSize);
    const result = await commandBus.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/search', generalRateLimiter, async (req, res, next) => {
  try {
    const searchSchema = z
      .object({
        q: z.string().min(2),
      })
      .merge(recipeFiltersSchema)
      .merge(paginationSchema);

    const input = searchSchema.parse(req.query);

    const { q, page, pageSize, ...filters } = input;
    const sortObj = recipeSortQuerySchema.parse(req.query);

    const query = new SearchRecipesQuery(q, filters, sortObj, page, pageSize);
    const result = await commandBus.executeQuery(query);
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
      (req as AuthenticatedRequest).user?.roles.includes(UserRole.ADMIN)
        ? UserRole.ADMIN
        : undefined,
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
router.post(
  '/',
  authenticateJwt,
  authorize(UserRole.AUTHOR, UserRole.ADMIN),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = createRecipeSchema.parse(req.body);
      const command = new CreateRecipeCommand(req.user!.id, input);
      const recipe = await commandBus.executeCommand(command);
      res.status(201).json(recipe);
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/:id',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const input = updateRecipeSchema.parse(req.body);
      const rawVersion = req.headers['if-match'];
      const expectedVersion = typeof rawVersion === 'string' && /^\d+$/.test(rawVersion)
        ? Number(rawVersion)
        : NaN;
      if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
        throw new ValidationError({ 'If-Match': ['A valid recipe version is required'] });
      }
      const command = new UpdateRecipeCommand(
        req.params.id!,
        req.user!.id,
        input,
        expectedVersion,
        req.user!.roles.includes(UserRole.ADMIN),
      );
      const recipe = await commandBus.executeCommand(command);
      res.status(200).json(recipe);
    } catch (error) {
      next(error);
    }
  },
);

router.patch('/:id/publish', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new PublishRecipeCommand(
      req.params.id!,
      req.user!.id,
      req.user!.roles.includes(UserRole.ADMIN),
    );
    const recipe = await commandBus.executeCommand(command);
    res.status(200).json(recipe);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/unpublish', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new UnpublishRecipeCommand(
      req.params.id!,
      req.user!.id,
      req.user!.roles.includes(UserRole.ADMIN),
    );
    const recipe = await commandBus.executeCommand(command);
    res.status(200).json(recipe);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new ArchiveRecipeCommand(
      req.params.id!,
      req.user!.id,
      req.user!.roles.includes(UserRole.ADMIN),
    );
    res.status(200).json(await commandBus.executeCommand(command));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeCommand(
      req.params.id!,
      req.user!.id,
      req.user!.roles.includes(UserRole.ADMIN),
    );
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Recipe image upload
router.post(
  '/:id/images',
  authenticateJwt,
  authorize(UserRole.AUTHOR, UserRole.ADMIN),
  uploadRateLimiter,
  uploadImageFile,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError({ file: ['An image file is required'] });
      }
      const recipe = await getContainer().prisma.recipe.findFirst({
        where: { id: req.params.id!, isDeleted: false },
        select: { authorId: true },
      });
      if (!recipe) throw new AppError(404, 'Recipe not found', 'NOT_FOUND', { title: 'Not Found' });
      if (!req.user!.roles.includes(UserRole.ADMIN) && recipe.authorId !== req.user!.id) {
        throw new AppError(403, 'You can only upload images to your own recipes', 'FORBIDDEN', { title: 'Forbidden' });
      }
      assertImageSize(req.file.size);
      const detected = await detectAllowedImage(req.file.buffer);
      const key = buildImageKey(req.params.id!, detected.extension);
      const originalUrl = await getContainer().fileStorageService.uploadFile(
        key,
        req.file.buffer,
        detected.mime,
      );
      res.status(201).json({ originalUrl });
    } catch (error) {
      next(error);
    }
  },
);

// Recipe Steps
router.get('/:id/steps', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await commandBus.executeQuery(
      new GetRecipeStepsQuery(
        req.params.id!,
        req.user!.id,
        req.user!.roles.includes(UserRole.ADMIN),
      ),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/steps',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const stepSchema = z.object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1),
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
        input.imageUrl,
        req.user!.roles.includes(UserRole.ADMIN),
      );
      const stepId = await commandBus.executeCommand(command);
      res.status(201).json({ id: stepId, message: 'Step added successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  '/:id/steps/:stepId',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const stepSchema = z.object({
        stepNumber: z.number().int().positive().optional(),
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().min(1).optional(),
        timerMinutes: z.number().int().nonnegative().nullable().optional(),
        imageUrl: z.string().url().max(500).nullable().optional(),
      }).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

      const input = stepSchema.parse(req.body);
      const command = new UpdateRecipeStepCommand(
        req.params.id!,
        req.user!.id,
        req.params.stepId!,
        input.stepNumber,
        input.title,
        input.description,
        input.timerMinutes,
        input.imageUrl,
        req.user!.roles.includes(UserRole.ADMIN),
      );
      await commandBus.executeCommand(command);
      res.json({ message: 'Step updated successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id/steps/:stepId',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const command = new DeleteRecipeStepCommand(
        req.params.id!,
        req.user!.id,
        req.params.stepId!,
        req.user!.roles.includes(UserRole.ADMIN),
      );
      await commandBus.executeCommand(command);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// Ingredient ownership is checked in the query/command handlers against the recipe.
router.get('/:id/ingredients', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await commandBus.executeQuery(
      new GetRecipeIngredientsQuery(
        req.params.id!,
        req.user!.id,
        req.user!.roles.includes(UserRole.ADMIN),
      ),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});
// Recipe Ingredients
router.post('/:id/ingredients', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const ingredientSchema = z.object({
      name: z.string().trim().min(1).max(200),
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
      req.user!.roles.includes(UserRole.ADMIN),
    );
    const ingredient = await commandBus.executeCommand(command);
    res.status(201).json(ingredient);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id/ingredients/:ingredientId',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const ingredientSchema = z.object({
        name: z.string().trim().min(1).max(200).optional(),
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
        req.user!.roles.includes(UserRole.ADMIN),
      );
      const ingredient = await commandBus.executeCommand(command);
      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id/ingredients/:ingredientId',
  authenticateJwt,
  async (req: AuthenticatedRequest, res, next) => {
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
  },
);

export default router;
