import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors/AppError.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code || 'ERROR',
      message: err.message,
      ...(err instanceof AppError && 'errors' in err ? { errors: (err as any).errors } : {}),
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
