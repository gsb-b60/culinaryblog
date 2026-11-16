import { Request, Response } from 'express';

import { getCorrelationId } from '../src/config-middleware/shared/logging/LoggingContext.js';
import { correlationIdMiddleware } from '../src/presentation/middleware/CorrelationIdMiddleware.js';

describe('correlationIdMiddleware', () => {
  it('uses a valid request ID, returns it in the response, and binds it to log context', () => {
    const req = { headers: { 'x-correlation-id': 'request-123' } } as Request;
    const setHeader = vi.fn();
    const next = vi.fn(() => {
      expect(getCorrelationId()).toBe('request-123');
    });

    correlationIdMiddleware(req, { setHeader } as unknown as Response, next);

    expect((req as Request & { correlationId?: string }).correlationId).toBe('request-123');
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'request-123');
    expect(next).toHaveBeenCalledOnce();
  });

  it('replaces an invalid request ID with a generated ID', () => {
    const req = { headers: { 'x-correlation-id': 'invalid id' } } as Request;
    const setHeader = vi.fn();

    correlationIdMiddleware(req, { setHeader } as unknown as Response, vi.fn());

    const correlationId = (req as Request & { correlationId?: string }).correlationId;
    expect(correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', correlationId);
  });
});
