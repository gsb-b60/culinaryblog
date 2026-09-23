import type { Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).type('application/problem+json').json({
    type: 'NOT_FOUND',
    title: 'Not Found',
    status: 404,
    detail: 'The requested resource was not found',
  });
}
