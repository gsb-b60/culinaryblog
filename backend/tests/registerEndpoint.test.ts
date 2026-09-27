import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commandBus } from '../src/application/command-bus.js';
import { RegisterCommand } from '../src/application/commands/auth/AuthCommands.js';
import { RegisterCommandHandler } from '../src/application/handlers/AuthCommandHandlers.js';
import { JwtService } from '../src/infrastructure/auth/JwtService.js';
import { globalErrorHandler } from '../src/presentation/middleware/GlobalErrorHandler.js';
import authRoutes from '../src/presentation/routes/authRoutes.js';

const validBody = {
  fullName: 'Nguyen Van A',
  email: 'an@example.com',
  userName: 'nguyenvana',
  password: 'Secret1!',
};

const prismaMock = {
  user: { findUnique: vi.fn(), create: vi.fn() },
  refreshToken: { create: vi.fn() },
};
const enqueueMock = vi.fn();

function buildApp(): express.Express {
  commandBus.registerCommandHandler(
    RegisterCommand.name,
    new RegisterCommandHandler({
      prisma: prismaMock as never,
      jwtService: new JwtService(),
      hashPassword: (password: string) => bcrypt.hash(password, 12),
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
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: args.data.id, avatarUrl: null, ...args.data }),
  );
  prismaMock.refreshToken.create.mockResolvedValue({});
  enqueueMock.mockResolvedValue(undefined);
  app = buildApp();
});

describe('POST /api/v1/auth/register', () => {
  it('returns 201 with a token pair and the created user (AC1, AC8)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresAt: expect.any(String),
      user: {
        fullName: 'Nguyen Van A',
        email: 'an@example.com',
        userName: 'nguyenvana',
        roles: ['AUTHOR'],
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const claims = jwt.verify(
      res.body.accessToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as jwt.JwtPayload & {
      userId: string;
      roles: string[];
      jti: string;
    };
    expect(claims.userId).toBe(res.body.user.id);
    expect(claims.email).toBe('an@example.com');
    expect(claims.roles).toEqual(['AUTHOR']);
    expect(claims.jti).toEqual(expect.any(String));
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(900);
  });

  it('stores the password as a bcrypt hash, never plaintext (AC4)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    const createArgs = prismaMock.user.create.mock.calls[0]?.[0] as {
      data: { passwordHash: string };
    };
    expect(createArgs.data.passwordHash).not.toBe(validBody.password);
    expect(createArgs.data.passwordHash.startsWith('$2a$12$')).toBe(true);
    expect(await bcrypt.compare(validBody.password, createArgs.data.passwordHash)).toBe(true);
  });

  it('assigns the Author role on registration (AC5)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    const createArgs = prismaMock.user.create.mock.calls[0]?.[0] as {
      data: { role: string };
    };
    expect(createArgs.data.role).toBe('AUTHOR');
    expect(res.body.user.roles).toEqual(['AUTHOR']);
  });

  it('persists the refresh token as a sha256 hash (AC6)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    const refreshArgs = prismaMock.refreshToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string; expiresAt: Date };
    };
    expect(refreshArgs.data.tokenHash).toBe(
      createHash('sha256').update(res.body.refreshToken).digest('hex'),
    );
    expect(refreshArgs.data.tokenHash).not.toBe(res.body.refreshToken);
    expect(refreshArgs.data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('enqueues the welcome email job in BullMQ (AC7)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(enqueueMock).toHaveBeenCalledWith({
      email: 'an@example.com',
      displayName: 'Nguyen Van A',
    });
  });

  it('returns 409 with an RFC 7807 body when the email already exists (AC2 / A1)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_EMAIL_EXISTS',
      title: 'Conflict',
      status: 409,
      detail: 'Email already registered',
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('returns 422 with per-field errors for a weak password (AC3 / A3)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, password: 'weakpass' });

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.status).toBe(422);
    expect(res.body.errors.password).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/uppercase/),
        expect.stringMatching(/special/),
      ]),
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('returns 422 with field errors for an invalid email (A3)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.errors.email).toBeDefined();
  });

  it('returns 422 when required fields are missing (A3)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['fullName', 'email', 'userName', 'password']),
    );
  });

  it('returns 500 without a stack trace when the database fails (A4)', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED 5432'));

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

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
