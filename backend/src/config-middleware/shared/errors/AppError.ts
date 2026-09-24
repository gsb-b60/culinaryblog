export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly type: string;
  public readonly title: string;
  public readonly errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    options?: { type?: string; title?: string; errors?: Record<string, string[]> }
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.type = options?.type ?? 'about:blank';
    this.title = options?.title ?? 'Error';
    this.errors = options?.errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND', { title: 'Not Found' });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED', { title: 'Unauthorized' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN', { title: 'Forbidden' });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT', { title: 'Conflict' });
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(422, 'Validation failed', 'VALIDATION_ERROR', { 
      title: 'Validation Error',
      type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
      errors 
    });
    this.errors = errors;
  }
}