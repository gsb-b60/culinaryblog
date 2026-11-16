import { randomUUID } from 'node:crypto';

import apicache from 'apicache';
import { NextFunction, Request, Response, Router } from 'express';
import { fileTypeFromBuffer } from 'file-type';
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
import { 
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
import { env } from '../../config-middleware/config/env.js';
import { ValidationError, NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { UserRole } from '../../domain/enums/UserRole.js';
import { getContainer } from '../di/container.js';
import { authenticateJwt, AuthenticatedRequest, authorize, authorizeOwnerOrAdmin, optionalAuth } from '../middleware/AuthMiddleware.js';
import { uploadRateLimiter } from '../middleware/RateLimitMiddleware.js';

const router: Router = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2, fieldSize: 2048 },
});

const parseImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  imageUpload.single('file')(req, res, (error: unknown) => {
    if (error) {
      next(new ValidationError({ file: [error instanceof Error ? error.message : 'Invalid image upload'] }));
      return;
    }
    next();
  });
};

apicache.options({
  appendKey: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return `user:${authReq.user?.id ?? 'guest'}:role:${authReq.user?.roles.join(',') ?? 'GUEST'}`;
  },
});

async function getRecipeOwnerId(req: AuthenticatedRequest): Promise<string | null> {
  const recipe = await getContainer().prisma.recipe.findFirst({
    where: { id: req.params.id, isDeleted: false },
    select: { authorId: true },
  });
  return recipe?.authorId ?? null;
}

function getImageStorageKey(imageUrl: string): string {
  const prefix = `${env.S3_ENDPOINT!.replace(/\/$/, '')}/${env.S3_BUCKET}/`;
  if (!imageUrl.startsWith(prefix)) throw new Error('Image URL does not match configured object storage');
  return decodeURIComponent(imageUrl.slice(prefix.length));
}

router.post('/:id/images', authenticateJwt, uploadRateLimiter, authorizeOwnerOrAdmin(getRecipeOwnerId), parseImageUpload, async (req: AuthenticatedRequest, res, next) => {
  let uploadedKey: string | undefined;
  try {
    if (!req.file) throw new ValidationError({ file: ['An image file is required'] });
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    if (!fileType || !allowedTypes.has(fileType.mime)) {
      throw new ValidationError({ file: ['Only JPEG, PNG, WebP, GIF, and AVIF images are allowed'] });
    }
    const metadata = z.object({
      altText: z.string().max(200).optional(),
      isPrimary: z.enum(['true', 'false']).optional(),
    }).parse(req.body);

    const container = getContainer();
    const key = `recipes/${req.params.id}/${randomUUID()}.${fileType.ext}`;
    uploadedKey = key;
    const originalUrl = await container.fileStorageService.uploadFile(key, req.file.buffer, fileType.mime);
    const isPrimary = metadata.isPrimary === 'true';
    const maxOrder = await container.prisma.recipeImage.aggregate({
      where: { recipeId: req.params.id, isDeleted: false },
      _max: { orderIndex: true },
    });
    const image = await container.prisma.$transaction(async transaction => {
      if (isPrimary) {
        await transaction.recipeImage.updateMany({
          where: { recipeId: req.params.id, isDeleted: false },
          data: { isPrimary: false },
        });
      }
      return transaction.recipeImage.create({
        data: {
          recipeId: req.params.id!,
          originalUrl,
          altText: metadata.altText,
          isPrimary,
          orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
        },
      });
    });
    res.status(201).json({ imageId: image.id, originalUrl: image.originalUrl, altText: image.altText, isPrimary: image.isPrimary });
  } catch (error) {
    if (uploadedKey) getContainer().fileStorageService.deleteFile(uploadedKey).catch(() => undefined);
    next(error);
  }
});

router.patch('/:id/images/:imageId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = z.object({
      altText: z.string().max(200).nullable().optional(),
      isPrimary: z.boolean().optional(),
      orderIndex: z.number().int().nonnegative().optional(),
    }).parse(req.body);
    const container = getContainer();
    const existing = await container.prisma.recipeImage.findFirst({
      where: { id: req.params.imageId, recipeId: req.params.id, isDeleted: false },
    });
    if (!existing) throw new NotFoundError('Recipe image');

    const image = await container.prisma.$transaction(async transaction => {
      if (input.isPrimary) {
        await transaction.recipeImage.updateMany({
          where: { recipeId: req.params.id, isDeleted: false },
          data: { isPrimary: false },
        });
      }
      return transaction.recipeImage.update({
        where: { id: existing.id },
        data: input,
      });
    });
    res.json(image);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/images/:imageId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const container = getContainer();
    const image = await container.prisma.recipeImage.findFirst({
      where: { id: req.params.imageId, recipeId: req.params.id, isDeleted: false },
    });
    if (!image) throw new NotFoundError('Recipe image');
    await container.prisma.recipeImage.update({ where: { id: image.id }, data: { isDeleted: true, isPrimary: false } });
    await container.fileStorageService.deleteFile(getImageStorageKey(image.originalUrl));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Public routes
router.get(
  '/',
  optionalAuth,
  apicache.middleware('15 minutes'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { sort: sortValue, ...queryFilters } = req.query;
      const filters = recipeFiltersSchema.parse(queryFilters);
      const parsedSort = typeof sortValue === 'string' ? sortValue : '-createdAt';
      const descending = parsedSort.startsWith('-');
      const field = typeof req.query.sortBy === 'string' ? req.query.sortBy : descending ? parsedSort.slice(1) : parsedSort;
      const order = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : descending ? 'desc' : 'asc';
      const sort = recipeSortSchema.parse({ field, order });
      const pagination = paginationSchema.parse(req.query);

      const query = new GetRecipesQuery(
        filters,
        sort,
        pagination.page,
        pagination.pageSize,
        req.user?.id,
        req.user?.roles.includes(UserRole.ADMIN)
          ? UserRole.ADMIN
          : req.user
            ? UserRole.AUTHOR
            : UserRole.GUEST
      );
      const result = await commandBus.executeQuery(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/search', async (req, res, next) => {
  try {
    const searchSchema = z.object({
      q: z.string().min(2),
      sortBy: z.enum(['createdAt', 'title', 'prepTime', 'cookTime', 'publishedAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      field: z.enum(['createdAt', 'title', 'prepTime', 'cookTime', 'publishedAt']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }).merge(recipeFiltersSchema).merge(paginationSchema);

    const input = searchSchema.parse(req.query);
    
    const { q, sortBy, sortOrder, field, order, page, pageSize, ...filters } = input;

    const sortObj = recipeSortSchema.parse({ field: sortBy ?? field ?? 'createdAt', order: sortOrder ?? order ?? 'desc' });

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

router.get('/:slug', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = new GetRecipeBySlugQuery(
      req.params.slug!,
      req.user?.id,
      req.user?.roles.includes(UserRole.ADMIN) ? UserRole.ADMIN : req.user ? UserRole.AUTHOR : UserRole.GUEST
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
router.post('/', authenticateJwt, authorize(UserRole.AUTHOR, UserRole.ADMIN), async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = createRecipeSchema.parse(req.body);
    const command = new CreateRecipeCommand(req.user!.id, input);
    const recipeId = await commandBus.executeCommand(command);
    res.status(201).json({ id: recipeId, message: 'Recipe created successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
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

router.patch('/:id/publish', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new PublishRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe published successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/unpublish', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new UnpublishRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe unpublished successfully' });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/archive', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new ArchiveRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.json({ message: 'Recipe archived successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeCommand(req.params.id!, req.user!.id);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Recipe Steps
router.post('/:id/steps', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const stepSchema = z.object({
      stepNumber: z.number().int().positive(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      timerMinutes: z.number().int().nonnegative().optional(),
      imageUrl: z.string().url().max(500).optional(),
    });
    
    const input = stepSchema.parse(req.body);
    const command = new AddRecipeStepCommand(
      req.params.id!,
      req.user!.id,
      input.stepNumber,
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

router.put('/:id/steps/:stepId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
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

router.delete('/:id/steps/:stepId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeStepCommand(req.params.id!, req.user!.id, req.params.stepId!);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Recipe Ingredients
router.post('/:id/ingredients', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
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
      input.orderIndex
    );
    const ingredientId = await commandBus.executeCommand(command);
    res.status(201).json({ id: ingredientId, message: 'Ingredient added successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/ingredients/:ingredientId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
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
      input.orderIndex
    );
    await commandBus.executeCommand(command);
    res.json({ message: 'Ingredient updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/ingredients/:ingredientId', authenticateJwt, authorizeOwnerOrAdmin(getRecipeOwnerId), async (req: AuthenticatedRequest, res, next) => {
  try {
    const command = new DeleteRecipeIngredientCommand(req.params.id!, req.user!.id, req.params.ingredientId!);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;