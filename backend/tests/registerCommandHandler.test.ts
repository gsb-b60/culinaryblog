import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterCommand } from '../src/application/commands/auth/RegisterCommand.js';
import {
  RegisterCommandHandler,
  type RegisterHandlerDeps,
} from '../src/application/commands/auth/RegisterCommandHandler.js';
import { hashPassword } from '../src/infrastructure/services/passwordService.js';
import { generateRefreshToken, hashToken } from '../src/infrastructure/services/tokenService.js';
import { AppError, ConflictError, ValidationError } from '../src/config-middleware/shared/errors/AppError.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const validCommand = new RegisterCommand(
  'Nguyen Van A',
  'an@example.com',
  'nguyenvana',
  'Secret1!',
);

interface MockPrisma {
  prisma: PrismaClient;
  user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  role: { findUnique: ReturnType<typeof vi.fn> };
  userRole: { create: ReturnType<typeof vi.fn> };
  refreshToken: { create: ReturnType<typeof vi.fn> };
  transaction: ReturnType<typeof vi.fn>;
}

function createMockPrisma(): MockPrisma {
  const user = { findUnique: vi.fn(), create: vi.fn() };
  const role = { findUnique: vi.fn() };
  const userRole = { create: vi.fn() };
  const refreshToken = { create: vi.fn() };
  const transaction = vi.fn((ops: Promise<unknown>[]) => Promise.all(ops));
  const prisma = {
    user,
    role,
    userRole,
    refreshToken,
    $transaction: transaction,
  } as unknown as PrismaClient;
  return { prisma, user, role, userRole, refreshToken, transaction };
}

describe('RegisterCommandHandler', () => {
  let mock: MockPrisma;
  let deps: RegisterHandlerDeps;
  let enqueueWelcomeEmail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mock = createMockPrisma();
    enqueueWelcomeEmail = vi.fn();
    deps = {
      prisma: mock.prisma,
      hashPassword,
      signAccessToken: vi.fn(() => ({
        token: 'signed-access-token',
        expiresAt: new Date('2026-01-01T00:15:00.000Z'),
      })),
      generateRefreshToken,
      hashToken,
      enqueueWelcomeEmail,
      refreshTokenTtlMs: SEVEN_DAYS_MS,
    };

    mock.user.findUnique.mockResolvedValue(null);
    mock.role.findUnique.mockResolvedValue({ id: 'role-author', name: 'Author' });
    mock.user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: args.data.id, avatarUrl: null, ...args.data }),
    );
    mock.userRole.create.mockResolvedValue({});
    mock.refreshToken.create.mockResolvedValue({});
  });

  it('creates the user, assigns the Author role, persists the refresh token and enqueues the welcome email', async () => {
    const handler = new RegisterCommandHandler(deps);
    const result = await handler.execute(validCommand);

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.expiresAt).toBe('2026-01-01T00:15:00.000Z');
    expect(result.user).toMatchObject({
      fullName: 'Nguyen Van A',
      email: 'an@example.com',
      userName: 'nguyenvana',
      roles: ['Author'],
      avatarUrl: null,
    });
    expect(result.refreshToken).toMatch(/^[0-9a-f]{128}$/);

    const createArgs = mock.user.create.mock.calls[0]?.[0] as {
      data: { id: string; passwordHash: string };
    };
    expect(createArgs.data.passwordHash).not.toBe('Secret1!');
    expect(await bcrypt.compare('Secret1!', createArgs.data.passwordHash)).toBe(true);

    expect(mock.userRole.create).toHaveBeenCalledWith({
      data: { userId: createArgs.data.id, roleId: 'role-author' },
    });

    const refreshArgs = mock.refreshToken.create.mock.calls[0]?.[0] as {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    };
    expect(refreshArgs.data.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(refreshArgs.data.expiresAt.getTime()).toBeGreaterThan(Date.now() + SEVEN_DAYS_MS - 5000);
    expect(refreshArgs.data.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + SEVEN_DAYS_MS + 5000);

    expect(enqueueWelcomeEmail).toHaveBeenCalledWith({
      userId: createArgs.data.id,
      email: 'an@example.com',
    });
  });

  it('throws 409 AUTH_EMAIL_EXISTS when the email already exists (A1)', async () => {
    mock.user.findUnique.mockResolvedValue({ id: 'existing-user' });
    const handler = new RegisterCommandHandler(deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_EMAIL_EXISTS',
    });
    expect(mock.user.create).not.toHaveBeenCalled();
  });

  it('maps a P2002 email race to 409 AUTH_EMAIL_EXISTS', async () => {
    mock.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });
    const handler = new RegisterCommandHandler(deps);

    await expect(handler.execute(validCommand)).rejects.toBeInstanceOf(ConflictError);
    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_EMAIL_EXISTS',
    });
  });

  it('maps a P2002 userName race to 409 AUTH_USERNAME_EXISTS', async () => {
    mock.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['user_name'] },
    });
    const handler = new RegisterCommandHandler(deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 409,
      code: 'AUTH_USERNAME_EXISTS',
    });
  });

  it('throws 422 with field errors when password hashing fails (A2)', async () => {
    deps = { ...deps, hashPassword: vi.fn().mockRejectedValue(new Error('hash failed')) };
    const handler = new RegisterCommandHandler(deps);

    const error = await handler.execute(validCommand).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as AppError).statusCode).toBe(422);
    expect((error as ValidationError).errors?.password).toBeDefined();
    expect(mock.user.create).not.toHaveBeenCalled();
  });

  it('throws 500 when the Author role seed is missing', async () => {
    mock.role.findUnique.mockResolvedValue(null);
    const handler = new RegisterCommandHandler(deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({ statusCode: 500 });
  });

  it('still succeeds when enqueueWelcomeEmail throws synchronously (fire-and-forget)', async () => {
    enqueueWelcomeEmail.mockImplementation(() => {
      throw new Error('redis down');
    });
    const handler = new RegisterCommandHandler(deps);

    const result = await handler.execute(validCommand);
    expect(result.accessToken).toBe('signed-access-token');
  });

  it('rethrows unexpected database errors (A4 -> handled as 500 upstream)', async () => {
    mock.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED'));
    const handler = new RegisterCommandHandler(deps);

    await expect(handler.execute(validCommand)).rejects.toThrow('ECONNREFUSED');
  });
});
