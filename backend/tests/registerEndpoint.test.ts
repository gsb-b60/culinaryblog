import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, enqueueMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    role: { findUnique: vi.fn() },
    userRole: { create: vi.fn() },
    refreshToken: { create: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
  enqueueMock: vi.fn(),
}));

vi.mock('../src/config-middleware/shared/database/client.js', () => ({
  prisma: prismaMock,
  disconnectPrisma: vi.fn(),
}));

vi.mock('../src/infrastructure/queue/welcomeEmailQueue.js', () => ({
  enqueueWelcomeEmail: enqueueMock,
  closeWelcomeEmailQueue: vi.fn(),
}));

import { createApp } from '../src/app.js';
import { createCommandBus } from '../src/container.js';

const app = createApp(createCommandBus());

const validBody = {
  fullName: 'Nguyen Van A',
  email: 'an@example.com',
  userName: 'nguyenvana',
  password: 'Secret1!',
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: args.data.id, avatarUrl: null, ...args.data }),
  );
  prismaMock.role.findUnique.mockResolvedValue({ id: 'role-author', name: 'Author' });
  prismaMock.userRole.create.mockResolvedValue({});
  prismaMock.refreshToken.create.mockResolvedValue({});
  prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  enqueueMock.mockImplementation(() => {});
});

describe('POST /api/v1/auth/register', () => {
  it('returns 201 with a token pair and the created user (happy path)', async () => {
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
        roles: ['Author'],
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const claims = jwt.verify(
      res.body.accessToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as jwt.JwtPayload;
    expect(claims.sub).toBe(res.body.user.id);
    expect(claims.email).toBe('an@example.com');
    expect(claims.roles).toEqual(['Author']);

    const createArgs = prismaMock.user.create.mock.calls[0]?.[0] as {
      data: { passwordHash: string };
    };
    expect(createArgs.data.passwordHash).not.toBe(validBody.password);
    expect(await bcrypt.compare(validBody.password, createArgs.data.passwordHash)).toBe(true);

    expect(prismaMock.userRole.create).toHaveBeenCalledWith({
      data: { userId: expect.any(String), roleId: 'role-author' },
    });

    const refreshArgs = prismaMock.refreshToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string; expiresAt: Date };
    };
    expect(refreshArgs.data.tokenHash).toBe(
      createHash('sha256').update(res.body.refreshToken).digest('hex'),
    );
    expect(refreshArgs.data.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(enqueueMock).toHaveBeenCalledWith({
      userId: expect.any(String),
      email: 'an@example.com',
    });
  });

  it('returns 409 with an RFC 7807 body when the email already exists (A1)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'AUTH_EMAIL_EXISTS',
      title: 'Conflict',
      status: 409,
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it('returns 422 with per-field errors for a weak password (A3/AC)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, password: 'weakpass' });

    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.type).toBe('VALIDATION_ERROR');
    expect(res.body.errors.password).toEqual(
      expect.arrayContaining([
        expect.stringContaining('uppercase'),
        expect.stringContaining('digit'),
        expect.stringContaining('special'),
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

  it('returns 500 without a stack trace when the database fails (A4)', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED 5435'));

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      type: 'INTERNAL_ERROR',
      status: 500,
      detail: 'An unexpected error occurred',
    });
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('maps an unexpected P2002 outside the transaction to 409 (error-handler safety net)', async () => {
    prismaMock.refreshToken.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['token_hash'] },
    });

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.type).toBe('CONFLICT');
  });

  it('returns 400 problem details when the body is not a JSON object', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('"just-a-string"');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({ status: 400, title: 'Bad Request' });
    expect(res.body).not.toHaveProperty('stack');
  });

  it('returns 422 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.status).toBe(422);
    expect(res.body.type).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(['fullName', 'email', 'userName', 'password']),
    );
  });
});

describe('health & 404', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/live returns alive', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
  });

  it('GET /health/ready reports the database connection', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
  });

  it('GET /health/ready returns 503 when the database is down', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(503);
  });

  it('unknown routes return an RFC 7807 404', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ type: 'NOT_FOUND', status: 404 });
  });
});
