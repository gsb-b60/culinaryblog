import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { RegisterCommand } from '../../application/commands/auth/RegisterCommand.js';
import type { AuthResponseDto } from '../../application/commands/auth/RegisterCommandHandler.js';
import type { CommandBus } from '../../application/shared/commandBus.js';
import { env } from '../../config-middleware/config/env.js';

export function createAuthRouter(bus: CommandBus): Router {
  const router = Router();

  const registrationLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_AUTH,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (_req, res) => {
      res.setHeader(
        'Retry-After',
        String(Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000)),
      );
      res.status(429).type('application/problem+json').json({
        type: 'RATE_LIMIT_EXCEEDED',
        title: 'Too Many Requests',
        status: 429,
        detail: 'Too many requests, please try again later',
      });
    },
  });

  router.post('/register', registrationLimiter, async (req, res, next) => {
    try {
      const body = (req.body ?? {}) as {
        fullName?: string;
        email?: string;
        userName?: string;
        password?: string;
      };
      const command = new RegisterCommand(
        body.fullName ?? '',
        body.email ?? '',
        body.userName ?? '',
        body.password ?? '',
      );
      const result = await bus.dispatch<AuthResponseDto>(command);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
