import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { logger } from '../../config-middleware/config/logger.js';
import { AppError } from '../../config-middleware/shared/errors/AppError.js';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(issue.message);
    }

    res.status(422).json({
      type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
      title: 'Validation Error',
      status: 422,
      detail: 'Request validation failed',
      errors,
    });
    return;
  }

  // App errors (known business errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      type: err.type || 'about:blank',
      title: err.title || 'Error',
      status: err.statusCode,
      code: err.code,
      detail: err.message,
      errors: err.errors,
    });
    return;
  }

  // Unknown errors
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  });
}
