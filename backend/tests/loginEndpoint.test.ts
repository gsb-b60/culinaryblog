import { createHash } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { LoginCommand } from '../src/application/commands/auth/AuthCommands.js';
import { LoginCommandHandler } from '../src/application/handlers/AuthCommandHandlers.js';
import { JwtService } from '../src/infrastructure/auth/JwtService.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import authRoutes from '../src/presentation/routes/authRoutes.js';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH = 'hashed-secret';
const PASSWORD = 'Secret1!';

const validBody = { email: 'an@example.com', password: PASSWORD };

const prismaMock = {
  user: { findUnique: vi.fn(), update: vi.fn() },
  refreshToken: { create: vi.fn(), updateMany: vi.fn() },
};

function problem(status: number, type: string, title: string, detail: string) {
  return { type, title, status, detail };
}

function buildApp(): express.Express {
  commandBus.registerCommandHandler(
    LoginCommand.name,
    new LoginCommandHandler({
      prisma: prismaMock as never,
      jwtService: new JwtService(),
      verifyPassword: (password: string, hash: string) =>
        Promise.resolve(hash === PASSWORD_HASH && password === PASSWORD),
      accessTokenTtlMs: ACCESS_TTL_MS,
      refreshTokenTtlMs: REFRESH_TTL_MS,
    }),
  );

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(globalErrorHandler);
  return app;
}

function storedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'an@example.com',
    passwordHash: PASSWORD_HASH,
    fullName: 'Nguyen Van A',
    userName: 'nguyenvana',
    displayName: 'Nguyen Van A',
    avatarUrl: null,
    role: 'AUTHOR',
    isActive: true,
    accessFailedCount: 0,
    lockedUntil: null,
    ...overrides,
  };
}

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.user.findUnique.mockResolvedValue(storedUser());
  prismaMock.user.update.mockResolvedValue(storedUser());
  prismaMock.refreshToken.create.mockResolvedValue({});
  prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  app = buildApp();
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with the token pair and the user object (AC1)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresAt: expect.any(String),
      user: {
        id: 'user-1',
        fullName: 'Nguyen Van A',
        email: 'an@example.com',
        userName: 'nguyenvana',
        roles: ['AUTHOR'],
      },
    });
  });

  it('signs a 15 minute access token carrying the user id, email and roles', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    const claims = jwt.verify(
      res.body.accessToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as jwt.JwtPayload & { userId: string; email: string; roles: string[]; jti: string };
    expect(claims.userId).toBe('user-1');
    expect(claims.email).toBe('an@example.com');
    expect(claims.roles).toEqual(['AUTHOR']);
    expect(claims.jti).toEqual(expect.any(String));
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(900);
  });

  it('persists the refresh token as a sha256 hash and revokes prior tokens (AC5)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    const createArgs = prismaMock.refreshToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string; userId: string; expiresAt: Date };
    };
    expect(createArgs.data.tokenHash).toBe(
      createHash('sha256').update(res.body.refreshToken).digest('hex'),
    );
    expect(createArgs.data.tokenHash).not.toBe(res.body.refreshToken);
    expect(createArgs.data.userId).toBe('user-1');
    expect(createArgs.data.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const revokeArgs = prismaMock.refreshToken.updateMany.mock.calls[0]?.[0] as {
      where: { userId: string; revokedAt: null };
      data: { revokedAt: Date };
    };
    expect(revokeArgs.where).toEqual({ userId: 'user-1', revokedAt: null });
    expect(revokeArgs.data.revokedAt).toBeInstanceOf(Date);
  });

  it('never returns the password hash', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD_HASH);
  });

  it('returns 401 with the same generic detail for a wrong email and a wrong password (AC2)', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ ...validBody, password: 'WrongPass1!' });
    prismaMock.user.findUnique.mockResolvedValue(null);
    const wrongEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: PASSWORD });

    for (const res of [wrongPassword, wrongEmail]) {
      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.body).toMatchObject(
        problem(401, 'AUTH_INVALID_CREDENTIALS', 'Unauthorized', 'Email or password is incorrect'),
      );
    }
    expect(wrongEmail.body).toEqual(wrongPassword.body);
    expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns 403 AUTH_ACCOUNT_DISABLED for a deactivated account (AC3)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(storedUser({ isActive: false }));

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_ACCOUNT_DISABLED',
      title: 'Forbidden',
      status: 403,
    });
    expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns 403 AUTH_ACCOUNT_LOCKED while the account is temporarily locked', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      storedUser({ lockedUntil: new Date(Date.now() + 60_000) }),
    );

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ type: 'AUTH_ACCOUNT_LOCKED', status: 403 });
  });

  it('locks the account for 15 minutes on the fifth failed attempt (AC4)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(storedUser({ accessFailedCount: 4 }));

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ ...validBody, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    const updateArgs = prismaMock.user.update.mock.calls[0]?.[0] as {
      data: { accessFailedCount: number; lockedUntil: Date };
    };
    expect(updateArgs.data.accessFailedCount).toBe(0);
    expect(updateArgs.data.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns 422 with per-field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(422);
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('returns 422 when the body is empty', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('normalizes a mixed-case email before looking the user up', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '  AN@Example.COM  ', password: PASSWORD });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'an@example.com' },
    });
  });

  it('returns 500 without a stack trace when the database fails (A4)', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED 5432'));

    const res = await request(app).post('/api/v1/auth/login').send(validBody);

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      type: 'about:blank',
      status: 500,
      detail: 'An unexpected error occurred',
    });
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });
});
