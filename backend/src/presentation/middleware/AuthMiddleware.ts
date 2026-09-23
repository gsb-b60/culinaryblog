import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JwtService } from '../../../infrastructure/auth/JwtService.js';
import { UserRole } from '../../../domain/enums/UserRole.js';

const jwtService = new JwtService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    roles: UserRole[];
    isActive: boolean;
  };
}

export function authenticateJwt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: any) => {
    if (err || !user) {
      res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid or expired token',
      });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: any) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  })(req, res, next);
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Authentication required',
      });
      return;
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      res.status(403).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Forbidden',
        status: 403,
        detail: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function authorizeOwnerOrAdmin(getResourceOwnerId: (req: AuthenticatedRequest) => Promise<string | null>) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
        title: 'Unauthorized',
        status: 401,
        detail: 'Authentication required',
      });
      return;
    }

    const isAdmin = req.user.roles.includes(UserRole.ADMIN);
    if (isAdmin) {
      next();
      return;
    }

    const ownerId = await getResourceOwnerId(req);
    if (ownerId && ownerId === req.user.id) {
      next();
      return;
    }

    res.status(403).json({
      type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
      title: 'Forbidden',
      status: 403,
      detail: 'You can only access your own resources',
    });
  };
}