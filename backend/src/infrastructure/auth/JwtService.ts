import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config-middleware/config/env.js';
import { IJwtService, JwtPayload } from '../../../application/interfaces/IJwtService.js';

export class JwtService implements IJwtService {
  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      algorithm: 'HS256',
    });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): string | null {
    // Returns the hash for database lookup
    return this.hashRefreshToken(token);
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}