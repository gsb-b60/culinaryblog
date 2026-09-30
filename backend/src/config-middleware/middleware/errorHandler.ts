import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  BusinessRuleViolationException,
  DomainException,
  EntityNotFoundException,
  InvalidStateTransitionException,
} from '../../domain/exceptions/DomainException.js';
import { AppError } from '../shared/errors/AppError.js';
import { logger } from '../config/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      (errors[path] ??= []).push(issue.message);
    }

    sendProblem(res, req, 422, 'Validation Error', 'Request validation failed', 'VALIDATION_ERROR', errors);
    return;
  }

  if (err instanceof AppError) {
    const title = getStatusTitle(err.statusCode);
    const errors = 'errors' in err ? err.errors : undefined;
    sendProblem(res, req, err.statusCode, title, err.message, err.code, errors);
    return;
  }

  if (err instanceof EntityNotFoundException) {
    sendProblem(res, req, 404, 'Not Found', err.message, err.code);
    return;
  }

  if (err instanceof BusinessRuleViolationException || err instanceof InvalidStateTransitionException) {
    sendProblem(res, req, 409, 'Conflict', err.message, err.code);
    return;
  }

  if (err instanceof DomainException) {
    sendProblem(res, req, 400, 'Bad Request', err.message, err.code);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendProblem(res, req, 500, 'Internal Server Error', 'An unexpected error occurred', 'INTERNAL_ERROR');
}

function sendProblem(
  res: Response,
  req: Request,
  status: number,
  title: string,
  detail: string,
  code?: string,
  errors?: unknown
): void {
  res.status(status).type('application/problem+json').json({
    type: 'about:blank',
    title,
    status,
    detail,
    instance: req.originalUrl,
    ...(code ? { code } : {}),
    ...(errors ? { errors } : {}),
  });
}

function getStatusTitle(status: number): string {
  if (status === 400) return 'Bad Request';
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'Forbidden';
  if (status === 404) return 'Not Found';
  if (status === 409) return 'Conflict';
  return status >= 500 ? 'Internal Server Error' : 'Error';
}
