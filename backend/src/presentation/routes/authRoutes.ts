import { Router } from 'express';
import { z } from 'zod';

import { commandBus } from '../../application/command-bus.js';
import { 
  RegisterCommand, 
  LoginCommand, 
  RefreshTokenCommand, 
  GoogleAuthCommand,
  LogoutCommand 
} from '../../application/commands/auth/AuthCommands.js';
import { GetCurrentUserQuery } from '../../application/queries/auth/AuthQueries.js';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  googleAuthSchema 
} from '../../application/validators/authValidators.js';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/AuthMiddleware.js';
import { authRateLimiter } from '../middleware/RateLimitMiddleware.js';

const router = Router();

router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const command = new RegisterCommand(input);
    const userId = await commandBus.executeCommand(command);
    res.status(201).json({ userId });
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
    const { refreshToken } = req.body;
    const command = new LogoutCommand(refreshToken);
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
    const updateProfileSchema = z.object({
      displayName: z.string().min(2).max(100).optional(),
      avatarUrl: z.string().url().max(500).optional(),
      bio: z.string().max(2000).optional(),
    });
    
    updateProfileSchema.parse(req.body);
    // TODO: Implement UpdateProfileCommand
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;