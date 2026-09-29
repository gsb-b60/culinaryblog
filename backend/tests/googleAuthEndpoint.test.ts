import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { GoogleAuthCommand } from '../src/application/commands/auth/AuthCommands.js';
import {
  GoogleAuthCommandHandler,
  type GoogleProfile,
} from '../src/application/handlers/AuthCommandHandlers.js';
import { JwtService } from '../src/infrastructure/auth/JwtService.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import authRoutes from '../src/presentation/routes/authRoutes.js';

const validProfile: GoogleProfile = {
  sub: 'google-sub-123',
  email: 'google.user@example.com',
  emailVerified: true,
  name: 'Google User',
  picture: 'https://lh3.googleusercontent.com/a/pic.jpg',
};

const prismaMock = {
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  refreshToken: { create: vi.fn() },
};
const verifyGoogleToken = vi.fn();
const enqueueMock = vi.fn();

function buildApp(): express.Express {
  commandBus.registerCommandHandler(
    GoogleAuthCommand.name,
    new GoogleAuthCommandHandler({
      prisma: prismaMock as never,
      jwtService: new JwtService(),
      googleClientId: 'client-id.apps.googleusercontent.com',
      verifyGoogleToken,
      enqueueWelcomeEmail: enqueueMock,
      accessTokenTtlMs: 15 * 60 * 1000,
      refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
    }),
  );

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(globalErrorHandler);
  return app;
}

let app: express.Express;

beforeEach(() => {
  vi.clearAllMocks();
  verifyGoogleToken.mockResolvedValue({ ...validProfile });
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({
      id: args.data.id,
      userName: null,
      fullName: null,
      passwordHash: null,
      bio: null,
      avatarUrl: null,
      ...args.data,
    }),
  );
  prismaMock.user.update.mockImplementation(
    (args: { where: { id: string }; data: Record<string, unknown> }) =>
      Promise.resolve({ id: args.where.id, ...args.data }),
  );
  prismaMock.refreshToken.create.mockResolvedValue({});
  enqueueMock.mockResolvedValue(undefined);
  app = buildApp();
});

describe('POST /api/v1/auth/google', () => {
  it('returns 200 with a token pair and the user for a known Google identity (AC1)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: 'google.user@example.com',
      userName: 'nguyenvana',
      fullName: 'Google User',
      displayName: 'Google User',
      avatarUrl: null,
      role: 'AUTHOR',
      googleId: 'google-sub-123',
    });

    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'jwt-from-gsi' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresAt: expect.any(String),
      user: {
        email: 'google.user@example.com',
        fullName: 'Google User',
        roles: ['AUTHOR'],
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const claims = jwt.verify(
      res.body.accessToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as jwt.JwtPayload & { userId: string; roles: string[] };
    expect(claims.userId).toBe(res.body.user.id);
    expect(claims.roles).toEqual(['AUTHOR']);
  });

  it('returns 403 AUTH_ACCOUNT_NOT_REGISTERED for an unknown Google identity (AC1)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'jwt-from-gsi' });

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_ACCOUNT_NOT_REGISTERED',
      title: 'Forbidden',
      status: 403,
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it('returns 422 when idToken is missing (validation)', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({});

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.errors.idToken).toBeDefined();
    expect(verifyGoogleToken).not.toHaveBeenCalled();
  });

  it('returns 401 problem+json for an invalid Google token (AC4)', async () => {
    verifyGoogleToken.mockRejectedValue(new Error('invalid signature'));

    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'bad-token' });

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_GOOGLE_INVALID_TOKEN',
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid or expired Google token',
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns 400 problem+json when the Google profile has no email (AC5)', async () => {
    verifyGoogleToken.mockResolvedValue({ ...validProfile, email: '' });

    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'jwt-from-gsi' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      type: 'AUTH_GOOGLE_INVALID_PROFILE',
      title: 'Bad Request',
      status: 400,
    });
  });

  it('returns 502 problem+json when the Google API is unreachable (AC6)', async () => {
    verifyGoogleToken.mockRejectedValue(new Error('fetch failed'));

    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'jwt-from-gsi' });

    expect(res.status).toBe(502);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_GOOGLE_UNAVAILABLE',
      title: 'Bad Gateway',
      status: 502,
    });
  });
});
