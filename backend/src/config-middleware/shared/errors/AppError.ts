export class AppError extends Error {
  public readonly errors?: Record<string, string[]>;

  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, message, code);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, code = 'UNPROCESSABLE', errors?: Record<string, string[]>) {
    super(422, message, code, errors);
  }
}

export class ValidationError extends UnprocessableEntityError {
  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}
