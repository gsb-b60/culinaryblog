import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterCommand } from '../src/application/commands/auth/AuthCommands.js';
import {
  RegisterCommandHandler,
  RegisterHandlerDependencies,
} from '../src/application/handlers/AuthCommandHandlers.js';
import { AppError, ValidationError } from '../src/config-middleware/shared/errors/AppError.js';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const validCommand = new RegisterCommand({
  fullName: 'Nguyen Van A',
  email: 'an@example.com',
  userName: 'nguyenvana',
  password: 'Secret1!',
});

function createMocks() {
  const user = { findUnique: vi.fn(), create: vi.fn() };
  const refreshToken = { create: vi.fn() };
  const prisma = { user, refreshToken } as unknown as PrismaClient;

  const jwtService = {
    generateAccessToken: vi.fn(() => 'signed-access-token'),
    generateRefreshToken: vi.fn(() => 'a'.repeat(128)),
    hashRefreshToken: vi.fn((token: string) => createHash('sha256').update(token).digest('hex')),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    decodeToken: vi.fn(),
  };

  const enqueueWelcomeEmail = vi.fn();

  const deps: RegisterHandlerDependencies = {
    prisma,
    jwtService,
    hashPassword: (password: string) => bcrypt.hash(password, 12),
    enqueueWelcomeEmail,
    accessTokenTtlMs: ACCESS_TTL_MS,
    refreshTokenTtlMs: REFRESH_TTL_MS,
  };

  user.findUnique.mockResolvedValue(null);
  user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: args.data.id, avatarUrl: null, ...args.data }),
  );
  refreshToken.create.mockResolvedValue({});
  enqueueWelcomeEmail.mockResolvedValue(undefined);

  return { user, refreshToken, jwtService, enqueueWelcomeEmail, deps };
}

describe('RegisterCommandHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('creates the user with the AUTHOR role, persists the refresh token and enqueues the welcome email', async () => {
    const handler = new RegisterCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).toMatch(/^[0-9a-f]{128}$/);
    expect(result.user).toMatchObject({
      fullName: 'Nguyen Van A',
      email: 'an@example.com',
      userName: 'nguyenvana',
      roles: ['AUTHOR'],
    });

    const createArgs = mocks.user.create.mock.calls[0]?.[0] as {
      data: { passwordHash: string; role: string; displayName: string; userName: string };
    };
    expect(createArgs.data.role).toBe('AUTHOR');
    expect(createArgs.data.displayName).toBe('Nguyen Van A');
    expect(createArgs.data.userName).toBe('nguyenvana');
    expect(createArgs.data.passwordHash).not.toBe('Secret1!');
    expect(createArgs.data.passwordHash.startsWith('$2a$12$')).toBe(true);
    expect(await bcrypt.compare('Secret1!', createArgs.data.passwordHash)).toBe(true);

    const refreshArgs = mocks.refreshToken.create.mock.calls[0]?.[0] as {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    };
    expect(refreshArgs.data.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(refreshArgs.data.expiresAt.getTime()).toBeGreaterThan(
      Date.now() + REFRESH_TTL_MS - 5000,
    );
    expect(refreshArgs.data.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + REFRESH_TTL_MS + 5000,
    );

    expect(mocks.enqueueWelcomeEmail).toHaveBeenCalledWith({
      email: 'an@example.com',
      displayName: 'Nguyen Van A',
    });

    const expiresAt = new Date(result.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now() + ACCESS_TTL_MS - 5000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + ACCESS_TTL_MS + 5000);
  });

  it('throws 409 AUTH_EMAIL_EXISTS when the email already exists (A1)', async () => {
    mocks.user.findUnique.mockResolvedValue({ id: 'existing-user' });
    const handler = new RegisterCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_EMAIL_EXISTS',
    });
    expect(mocks.user.create).not.toHaveBeenCalled();
  });

  it('maps a P2002 email race to 409 AUTH_EMAIL_EXISTS', async () => {
    mocks.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });
    const handler = new RegisterCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_EMAIL_EXISTS',
    });
  });

  it('maps a P2002 userName race to 409 AUTH_USERNAME_EXISTS', async () => {
    mocks.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['user_name'] } });
    const handler = new RegisterCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_USERNAME_EXISTS',
    });
  });

  it('throws 422 with field errors when password hashing fails (A2)', async () => {
    const deps = {
      ...mocks.deps,
      hashPassword: vi.fn().mockRejectedValue(new Error('hash failed')),
    };
    const handler = new RegisterCommandHandler(deps);

    const error = await handler.execute(validCommand).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as AppError).statusCode).toBe(422);
    expect((error as ValidationError).errors?.password).toBeDefined();
    expect(mocks.user.create).not.toHaveBeenCalled();
  });

  it('still succeeds when enqueueWelcomeEmail throws (fire-and-forget)', async () => {
    mocks.enqueueWelcomeEmail.mockImplementation(() => {
      throw new Error('redis down');
    });
    const handler = new RegisterCommandHandler(mocks.deps);

    const result = await handler.execute(validCommand);
    expect(result.accessToken).toBe('signed-access-token');
  });

  it('rethrows unexpected database errors (A4 -> 500 upstream)', async () => {
    mocks.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED'));
    const handler = new RegisterCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toThrow('ECONNREFUSED');
  });

  it('rethrows non-unique-violation create errors', async () => {
    mocks.user.create.mockRejectedValue(new Error('disk full'));
    const handler = new RegisterCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toThrow('disk full');
  });
});
