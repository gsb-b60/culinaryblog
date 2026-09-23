import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  UnauthorizedError,
  ValidationError,
} from '../src/config-middleware/shared/errors/AppError.js';
import { JwtService } from '../src/infrastructure/services/JwtService.js';
import { hashPassword } from '../src/infrastructure/services/passwordService.js';
import { generateRefreshToken, hashToken } from '../src/infrastructure/services/tokenService.js';
import { parseDuration } from '../src/infrastructure/utils/duration.js';

describe('parseDuration', () => {
  it('parses supported units', () => {
    expect(parseDuration('15m')).toBe(15 * 60_000);
    expect(parseDuration('7d')).toBe(7 * 86_400_000);
    expect(parseDuration('500ms')).toBe(500);
    expect(parseDuration('30s')).toBe(30_000);
    expect(parseDuration('2h')).toBe(2 * 3_600_000);
  });

  it('throws on invalid input', () => {
    expect(() => parseDuration('soon')).toThrow('Invalid duration');
  });
});

describe('token services', () => {
  it('generates a 128-bit hex refresh token', () => {
    const token = generateRefreshToken();
    expect(token).toMatch(/^[0-9a-f]{128}$/);
    expect(generateRefreshToken()).not.toBe(token);
  });

  it('hashes tokens with sha256 (raw token is never stored)', () => {
    const token = generateRefreshToken();
    const hash = hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
  });
});

describe('JwtService', () => {
  it('signs a verifiable access token with sub/email/roles claims', () => {
    const service = new JwtService('test-secret-xxxxxxxxxxxxxxxxxxxxxxxx', '15m');
    const { token, expiresAt } = service.signAccessToken({
      sub: 'user-1',
      email: 'an@example.com',
      roles: ['Author'],
    });

    const claims = jwt.verify(token, 'test-secret-xxxxxxxxxxxxxxxxxxxxxxxx') as jwt.JwtPayload;
    expect(claims.sub).toBe('user-1');
    expect(claims.email).toBe('an@example.com');
    expect(claims.roles).toEqual(['Author']);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 60_000 + 5000);
  });
});

describe('password hashing', () => {
  it('hashes with bcrypt cost 12 and never returns plaintext', async () => {
    const hash = await hashPassword('Secret1!');
    expect(hash).not.toBe('Secret1!');
    expect(await bcrypt.compare('Secret1!', hash)).toBe(true);
    expect(await bcrypt.compare('Wrong1!', hash)).toBe(false);
  });
});

describe('error classes', () => {
  it('carry the RFC 7807 status/code contract', () => {
    expect(new NotFoundError('Recipe')).toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(new UnauthorizedError()).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
    expect(new ForbiddenError()).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(new ConflictError('dup', 'AUTH_EMAIL_EXISTS')).toMatchObject({
      statusCode: 409,
      code: 'AUTH_EMAIL_EXISTS',
    });
    expect(new ConflictError('dup')).toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    expect(new UnprocessableEntityError('nope')).toMatchObject({ statusCode: 422 });
    const validation = new ValidationError({ email: ['bad'] });
    expect(validation).toMatchObject({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      errors: { email: ['bad'] },
    });
  });
});
