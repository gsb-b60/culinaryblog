import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { IJwtService, JwtPayload } from '../../application/interfaces/IJwtService.js';
import { env } from '../../config-middleware/config/env.js';

export class JwtService implements IJwtService {
  private readonly issuer = 'lethimcook';
  private readonly audience = 'lethimcook-web';

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
      issuer: this.issuer,
      audience: this.audience,
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
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
        issuer: this.issuer,
        audience: this.audience,
        clockTolerance: 5,
      }) as JwtPayload;
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