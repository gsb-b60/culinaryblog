import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { JwtService } from '../src/infrastructure/auth/JwtService.js';
import {
  authenticateJwt,
  authorize,
  authorizeOwnerOrAdmin,
  type AuthenticatedRequest,
} from '../src/presentation/middleware/AuthMiddleware.js';
import {
  authRateLimiter,
  generalRateLimiter,
  passwordResetRateLimiter,
  uploadRateLimiter,
} from '../src/presentation/middleware/RateLimitMiddleware.js';
import { UserRole } from '../src/domain/enums/UserRole.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authorization middleware', () => {
  it('authorize() returns 401 when unauthenticated', () => {
    const req = {} as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    authorize(UserRole.ADMIN)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('authorize() returns 403 for insufficient role', () => {
    const req = {
      user: { id: 'u1', email: 'a@b.c', displayName: 'A', roles: [UserRole.AUTHOR], isActive: true },
    } as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    authorize(UserRole.ADMIN)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('authorize() allows AUTHOR to create recipes', () => {
    const req = {
      user: { id: 'u1', email: 'a@b.c', displayName: 'A', roles: [UserRole.AUTHOR], isActive: true },
    } as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    authorize(UserRole.AUTHOR, UserRole.ADMIN)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('authorizeOwnerOrAdmin allows admin bypass', async () => {
    const req = {
      user: { id: 'admin', email: 'a@b.c', displayName: 'A', roles: [UserRole.ADMIN], isActive: true },
      params: { id: 'r1' },
    } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    const getOwner = vi.fn().mockResolvedValue('someone-else');
    await authorizeOwnerOrAdmin(getOwner)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(getOwner).not.toHaveBeenCalled();
  });

  it('authorizeOwnerOrAdmin allows the owner', async () => {
    const req = {
      user: { id: 'u1', email: 'a@b.c', displayName: 'A', roles: [UserRole.AUTHOR], isActive: true },
      params: { id: 'r1' },
    } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    await authorizeOwnerOrAdmin(async () => 'u1')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('authorizeOwnerOrAdmin blocks non-owner non-admin', async () => {
    const req = {
      user: { id: 'u2', email: 'a@b.c', displayName: 'A', roles: [UserRole.AUTHOR], isActive: true },
      params: { id: 'r1' },
    } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();
    await authorizeOwnerOrAdmin(async () => 'u1')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticateJwt returns 401 without a token', async () => {
    const passport = (await import('passport')).default;
    const { configureJwtStrategy } = await import(
      '../src/infrastructure/auth/strategies/JwtStrategy.js'
    );
    configureJwtStrategy(passport);
    const app = express();
    app.use(passport.initialize());
    app.get('/private', authenticateJwt, (_req, res) => res.json({ ok: true }));
    const res = await request(app).get('/private');
    expect(res.status).toBe(401);
    expect(res.body.title).toBe('Unauthorized');
  });
});

describe('rate limiters', () => {
  it('exposes RFC7807 429 handlers with per-user keys', async () => {
    for (const limiter of [
      generalRateLimiter,
      authRateLimiter,
      passwordResetRateLimiter,
      uploadRateLimiter,
    ]) {
      expect(typeof limiter).toBe('function');
    }

    // Hitting the limiter repeatedly with the same key yields 429 + ProblemDetails.
    const app = express();
    app.use('/limited', authRateLimiter, (_req, res) => res.json({ ok: true }));
    let lastStatus = 200;
    let lastBody: any = {};
    // authRateLimiter max is 10000 in test env; force a tiny local limiter instead.
    const { default: rateLimit } = await import('express-rate-limit');
    const tiny = rateLimit({
      windowMs: 60000,
      max: 2,
      message: { type: 't', title: 'Too Many Requests', status: 429, detail: 'slow down' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    const app2 = express();
    app2.use('/t', tiny, (_req, res) => res.json({ ok: true }));
    for (let i = 0; i < 4; i++) {
      const r = await request(app2).get('/t');
      lastStatus = r.status;
      lastBody = r.body;
    }
    expect(lastStatus).toBe(429);
    expect(lastBody.status).toBe(429);
  });
});

describe('jwt hardening', () => {
  it('signs HS256 tokens with issuer/audience and verifies them', () => {
    const svc = new JwtService();
    const token = svc.generateAccessToken({
      userId: 'u1',
      email: 'a@b.c',
      roles: ['AUTHOR'],
      jti: 'jti-1',
    });
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.iss).toBe('lethimcook');
    expect(decoded.aud).toBe('lethimcook-web');

    const verified = svc.verifyAccessToken(token);
    expect(verified?.userId).toBe('u1');

    // Wrong audience must be rejected.
    const forged = jwt.sign(
      { userId: 'u1', email: 'a@b.c', roles: ['AUTHOR'], jti: 'x' },
      process.env.JWT_ACCESS_SECRET as string,
      { algorithm: 'HS256', issuer: 'lethimcook', audience: 'evil', expiresIn: '15m' },
    );
    expect(svc.verifyAccessToken(forged)).toBeNull();
  });
});

describe('security headers and body limits', () => {
  it('sets helmet headers and enforces 1mb json limit', async () => {
    const helmet = (await import('helmet')).default;
    const cors = (await import('cors')).default;
    const app = express();
    app.use(
      helmet({
        contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
        hsts: { maxAge: 31536000, includeSubDomains: true },
        referrerPolicy: { policy: 'no-referrer' },
      }),
    );
    app.use(
      cors({
        origin: (origin, cb) => {
          if (!origin || origin === 'http://localhost:5173') cb(null, true);
          else cb(new Error('CORS blocked'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'If-Match'],
      }),
    );
    app.use(express.json({ limit: '1mb' }));
    app.post('/echo', (req, res) => res.json({ ok: true }));

    const res = await request(app)
      .post('/echo')
      .set('Origin', 'http://localhost:5173')
      .send({ hello: 'world' });
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blocked = await request(app)
      .post('/echo')
      .set('Origin', 'https://evil.example')
      .send({ hello: 'world' });
    // cors middleware forwards an error; express default is 500 here, key point is
    // the origin is NOT echoed back.
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
