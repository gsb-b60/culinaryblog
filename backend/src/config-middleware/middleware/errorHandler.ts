import type { NextFunction, Request, Response } from 'express';

import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors/AppError.js';

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

interface PrismaKnownError {
  code: string;
  meta?: { target?: string | string[] };
}

interface HttpErrorLike {
  statusCode?: number;
  status?: number;
  expose?: boolean;
  type?: string;
}

function isPrismaUniqueViolation(err: unknown): err is PrismaKnownError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as PrismaKnownError).code === 'P2002'
  );
}

function clientErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) {
    return undefined;
  }
  const httpError = err as HttpErrorLike;
  const status = httpError.statusCode ?? httpError.status;
  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : undefined;
}

function uniqueViolationProblem(err: PrismaKnownError): ProblemDetails {
  const target = err.meta?.target;
  const fields = Array.isArray(target) ? target : target ? [target] : [];

  if (fields.some((field) => field.includes('email'))) {
    return {
      type: 'AUTH_EMAIL_EXISTS',
      title: 'Conflict',
      status: 409,
      detail: 'Email already registered',
    };
  }
  if (fields.some((field) => field.includes('user_name'))) {
    return {
      type: 'AUTH_USERNAME_EXISTS',
      title: 'Conflict',
      status: 409,
      detail: 'User name already exists',
    };
  }
  return {
    type: 'CONFLICT',
    title: 'Conflict',
    status: 409,
    detail: 'Resource already exists',
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  let problem: ProblemDetails;

  if (err instanceof AppError) {
    problem = {
      type: err.code || 'about:blank',
      title: STATUS_TITLES[err.statusCode] ?? 'Error',
      status: err.statusCode,
      detail: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    };
    if (problem.status >= 500) {
      logger.error({ err }, 'Request failed');
    }
  } else if (clientErrorStatus(err) !== undefined) {
    const status = clientErrorStatus(err) as number;
    const httpError = err as HttpErrorLike & Error;
    const title = STATUS_TITLES[status] ?? 'Error';
    problem = {
      type: httpError.type || 'about:blank',
      title,
      status,
      detail: httpError.expose === true ? httpError.message : title,
    };
    logger.warn({ err }, 'Request rejected');
  } else if (isPrismaUniqueViolation(err)) {
    problem = uniqueViolationProblem(err);
    logger.warn({ err }, 'Unique constraint violation');
  } else {
    logger.error({ err }, 'Unhandled error');
    problem = {
      type: 'INTERNAL_ERROR',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
    };
  }

  res.status(problem.status).type('application/problem+json').json(problem);
}
