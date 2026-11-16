import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { runWithCorrelationId } from '../../config-middleware/shared/logging/LoggingContext.js';

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers['x-correlation-id'];
  const candidate = typeof header === 'string' ? header.trim() : '';
  const correlationId = /^[A-Za-z0-9._:-]{1,128}$/.test(candidate) ? candidate : uuidv4();

  (req as Request & { correlationId?: string }).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  runWithCorrelationId(correlationId, next);
}