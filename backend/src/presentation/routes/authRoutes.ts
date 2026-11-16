import { Router } from 'express';

import { commandBus } from '../../application/command-bus.js';
import { 
  RegisterCommand, 
  LoginCommand, 
  RefreshTokenCommand, 
  GoogleAuthCommand,
  LogoutCommand,
  UpdateProfileCommand,
} from '../../application/commands/auth/AuthCommands.js';
import { GetCurrentUserQuery } from '../../application/queries/auth/AuthQueries.js';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  googleAuthSchema,
  updateProfileSchema,
} from '../../application/validators/authValidators.js';
import { logger } from '../../config-middleware/config/logger.js';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/AuthMiddleware.js';
import { authRateLimiter } from '../middleware/RateLimitMiddleware.js';

const router: Router = Router();

router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const command = new RegisterCommand(input);
    const userId = await commandBus.executeCommand<RegisterCommand, string>(command);
    void import('../../infrastructure/jobs/queues/welcomeEmailQueue.js')
      .then(({ addWelcomeEmailJob }) => addWelcomeEmailJob({
        userId,
        email: input.email,
      }))
      .catch(error => {
        logger.error({
          userId,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        }, 'Failed to enqueue welcome email');
      });
    res.status(201).json({ userId, email: input.email, displayName: input.displayName });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const command = new LoginCommand(input);
    const tokens = await commandBus.executeCommand(command);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/google', authRateLimiter, async (req, res, next) => {
  try {
    const input = googleAuthSchema.parse(req.body);
    const command = new GoogleAuthCommand(input);
    const tokens = await commandBus.executeCommand(command);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', authRateLimiter, async (req, res, next) => {
  try {
    const input = refreshTokenSchema.parse(req.body);
    const command = new RefreshTokenCommand(input);
    const tokens = await commandBus.executeCommand(command);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const command = new LogoutCommand(refreshToken, req.user!.id);
    await commandBus.executeCommand(command);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const query = new GetCurrentUserQuery(req.user!.id);
    const user = await commandBus.executeQuery(query);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/me', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await commandBus.executeCommand(new UpdateProfileCommand(req.user!.id, input));
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;