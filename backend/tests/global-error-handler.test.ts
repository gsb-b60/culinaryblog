import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  BusinessRuleViolationException,
  EntityNotFoundException,
} from '../src/domain/exceptions/DomainException.js';
import { errorHandler } from '../src/config-middleware/middleware/errorHandler.js';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

const request = { originalUrl: '/api/v1/categories/missing' } as Request;
const next = vi.fn() as unknown as NextFunction;

describe('global error handler', () => {
  it('returns Problem Details for domain not-found exceptions', () => {
    const response = createResponse();

    errorHandler(new EntityNotFoundException('Category', 'missing'), request, response, next);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: request.originalUrl,
      code: 'ENTITY_NOT_FOUND',
    }));
  });

  it('returns a conflict Problem Details response for business rule violations', () => {
    const response = createResponse();

    errorHandler(new BusinessRuleViolationException('Category cannot be deleted'), request, response, next);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Conflict',
      status: 409,
      code: 'BUSINESS_RULE_VIOLATION',
    }));
  });

  it('returns validation details for Zod errors', () => {
    const response = createResponse();
    const parsed = z.string().safeParse(42);

    if (parsed.success) {
      throw new Error('Expected the schema to reject a number');
    }

    errorHandler(parsed.error, request, response, next);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Validation Error',
      status: 422,
      code: 'VALIDATION_ERROR',
      errors: { '': ['Expected string, received number'] },
    }));
  });
});