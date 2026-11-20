import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { runWithRequestContext } from '../../config-middleware/shared/requestContext.js';

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId = req.headers['x-correlation-id'] as string
    || (req as Request & { id?: string }).id
    || uuidv4();

  (req as Request & { correlationId: string }).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  runWithRequestContext({ correlationId }, () => next());
}
