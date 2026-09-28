import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginCommand } from '../src/application/commands/auth/AuthCommands.js';
import {
  LOGIN_LOCK_DURATION_MS,
  LOGIN_MAX_FAILED_ATTEMPTS,
  LoginCommandHandler,
  type LoginHandlerDependencies,
} from '../src/application/handlers/AuthCommandHandlers.js';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GENERIC_401 = 'Email or password is incorrect';

const validCommand = new LoginCommand({
  email: 'an@example.com',
  password: 'Secret1!',
});

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  fullName: string | null;
  userName: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  accessFailedCount: number;
  lockedUntil: Date | null;
};

const PASSWORD_HASH = 'hashed-secret';

function createMocks(overrides: Partial<StoredUser> = {}) {
  const stored: StoredUser = {
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

  const user = { findUnique: vi.fn(), update: vi.fn() };
  const refreshToken = { create: vi.fn(), updateMany: vi.fn() };
  const prisma = { user, refreshToken } as unknown as PrismaClient;

  const jwtService = {
    generateAccessToken: vi.fn(() => 'signed-access-token'),
    generateRefreshToken: vi.fn(() => 'a'.repeat(128)),
    hashRefreshToken: vi.fn((token: string) => createHash('sha256').update(token).digest('hex')),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    decodeToken: vi.fn(),
  };

  const verifyPassword = vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === PASSWORD_HASH && password === 'Secret1!'),
  );

  const deps: LoginHandlerDependencies = {
    prisma,
    jwtService,
    verifyPassword,
    accessTokenTtlMs: ACCESS_TTL_MS,
    refreshTokenTtlMs: REFRESH_TTL_MS,
  };

  user.findUnique.mockResolvedValue(stored);
  user.update.mockResolvedValue(stored);
  refreshToken.create.mockResolvedValue({});
  refreshToken.updateMany.mockResolvedValue({ count: 0 });

  return { stored, user, refreshToken, jwtService, verifyPassword, deps };
}

function updateData(mock: { mock: { calls: unknown[][] } }): Record<string, unknown> {
  const call = mock.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
  return call?.data ?? {};
}

describe('LoginCommandHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    vi.useRealTimers();
    mocks = createMocks();
  });

  describe('happy path', () => {
    it('returns an access token, a refresh token and the user profile', async () => {
      const handler = new LoginCommandHandler(mocks.deps);

      const result = await handler.execute(validCommand);

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toBe('a'.repeat(128));
      expect(result.user).toMatchObject({
        id: 'user-1',
        fullName: 'Nguyen Van A',
        email: 'an@example.com',
        userName: 'nguyenvana',
        roles: ['AUTHOR'],
      });
    });

    it('signs the access token with the user id, email, roles and a jti', async () => {
      const handler = new LoginCommandHandler(mocks.deps);
      await handler.execute(validCommand);

      const payload = mocks.jwtService.generateAccessToken.mock.calls[0]?.[0] as {
        userId: string;
        email: string;
        roles: string[];
        jti: string;
      };
      expect(payload).toEqual({
        userId: 'user-1',
        email: 'an@example.com',
        roles: ['AUTHOR'],
        jti: expect.any(String),
      });
    });

    it('persists the refresh token as a sha256 hash that expires in 7 days', async () => {
      const handler = new LoginCommandHandler(mocks.deps);
      const result = await handler.execute(validCommand);

      const data = updateData(mocks.refreshToken.create) as {
        tokenHash: string;
        userId: string;
        expiresAt: Date;
      };
      expect(data.tokenHash).toBe(
        createHash('sha256').update(result.refreshToken).digest('hex'),
      );
      expect(data.tokenHash).not.toBe(result.refreshToken);
      expect(data.userId).toBe('user-1');
      expect(data.expiresAt.getTime()).toBeGreaterThan(
        Date.now() + REFRESH_TTL_MS - 5000,
      );
      expect(data.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + REFRESH_TTL_MS + 5000);
    });

    it('returns an expiresAt 15 minutes out', async () => {
      const handler = new LoginCommandHandler(mocks.deps);
      const result = await handler.execute(validCommand);

      const expiresAt = new Date(result.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now() + ACCESS_TTL_MS - 5000);
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + ACCESS_TTL_MS + 5000);
    });

    it('never leaks the password hash', async () => {
      const handler = new LoginCommandHandler(mocks.deps);
      const result = await handler.execute(validCommand);

      expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('falls back to displayName and an empty userName for accounts without them', async () => {
      mocks = createMocks({ fullName: null, userName: null, displayName: 'Google User' });
      const handler = new LoginCommandHandler(mocks.deps);

      const result = await handler.execute(validCommand);

      expect(result.user.fullName).toBe('Google User');
      expect(result.user.userName).toBe('');
    });
  });

  describe('refresh token reuse defence (AC5)', () => {
    it('marks every non-revoked refresh token of the user as used on login', async () => {
      const handler = new LoginCommandHandler(mocks.deps);
      await handler.execute(validCommand);

      const call = mocks.refreshToken.updateMany.mock.calls[0]?.[0] as {
        where: { userId: string; revokedAt: null };
        data: { revokedAt: Date };
      };
      expect(call.where).toEqual({ userId: 'user-1', revokedAt: null });
      expect(call.data.revokedAt).toBeInstanceOf(Date);
    });

    it('revokes the old tokens before persisting the new one', async () => {
      const order: string[] = [];
      mocks.refreshToken.updateMany.mockImplementation(() => {
        order.push('revoke');
        return Promise.resolve({ count: 3 });
      });
      mocks.refreshToken.create.mockImplementation(() => {
        order.push('create');
        return Promise.resolve({});
      });

      const handler = new LoginCommandHandler(mocks.deps);
      await handler.execute(validCommand);

      expect(order).toEqual(['revoke', 'create']);
    });
  });

  describe('invalid credentials (AC2)', () => {
    it('throws 401 AUTH_INVALID_CREDENTIALS when the email is unknown', async () => {
      mocks.user.findUnique.mockResolvedValue(null);
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(handler.execute(validCommand)).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: GENERIC_401,
      });
      expect(mocks.refreshToken.create).not.toHaveBeenCalled();
    });

    it('throws 401 AUTH_INVALID_CREDENTIALS when the password is wrong', async () => {
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(
        handler.execute(new LoginCommand({ email: 'an@example.com', password: 'WrongPass1!' })),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: GENERIC_401,
      });
      expect(mocks.refreshToken.create).not.toHaveBeenCalled();
    });

    it('returns an identical message for unknown email and wrong password (no user enumeration)', async () => {
      // Unknown email: the lookup must miss, so the handler takes the 401 path.
      mocks.user.findUnique.mockResolvedValue(null);
      const unknownEmail = new LoginCommandHandler(mocks.deps);
      const missing = await unknownEmail
        .execute(new LoginCommand({ email: 'ghost@example.com', password: 'Secret1!' }))
        .catch((e: unknown) => e);

      // Wrong password: the lookup hits, but the hash comparison fails.
      mocks = createMocks();
      const wrongPassword = new LoginCommandHandler(mocks.deps);
      const badPassword = await wrongPassword
        .execute(new LoginCommand({ email: 'an@example.com', password: 'Nope1!' }))
        .catch((e: unknown) => e);

      const asError = (e: unknown) => e as { statusCode: number; message: string; code: string };
      expect(asError(missing).statusCode).toBe(401);
      expect(asError(badPassword).statusCode).toBe(401);
      expect(asError(missing).message).toBe(asError(badPassword).message);
      expect(asError(missing).code).toBe(asError(badPassword).code);
    });

    it('runs a password verification even when the account is unknown, to equalize timing', async () => {
      mocks.user.findUnique.mockResolvedValue(null);
      const handler = new LoginCommandHandler(mocks.deps);

      await handler.execute(validCommand).catch(() => undefined);

      expect(mocks.verifyPassword).toHaveBeenCalledTimes(1);
    });

    it('throws 401 for a Google-only account that has no password hash', async () => {
      mocks = createMocks({ passwordHash: null });
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(handler.execute(validCommand)).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: GENERIC_401,
      });
      expect(mocks.verifyPassword).not.toHaveBeenCalled();
    });
  });

  describe('disabled and locked accounts (AC3)', () => {
    it('throws 403 AUTH_ACCOUNT_DISABLED when the account is deactivated', async () => {
      mocks = createMocks({ isActive: false });
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(handler.execute(validCommand)).rejects.toMatchObject({
        statusCode: 403,
        code: 'AUTH_ACCOUNT_DISABLED',
      });
      expect(mocks.refreshToken.create).not.toHaveBeenCalled();
    });

    it('throws 403 AUTH_ACCOUNT_LOCKED while the lockout window is still open', async () => {
      mocks = createMocks({ lockedUntil: new Date(Date.now() + 60_000) });
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(handler.execute(validCommand)).rejects.toMatchObject({
        statusCode: 403,
        code: 'AUTH_ACCOUNT_LOCKED',
      });
      expect(mocks.refreshToken.create).not.toHaveBeenCalled();
    });

    it('locks the account for 15 minutes on the fifth failed attempt', async () => {
      expect(LOGIN_MAX_FAILED_ATTEMPTS).toBe(5);
      expect(LOGIN_LOCK_DURATION_MS).toBe(15 * 60 * 1000);
      mocks = createMocks({ accessFailedCount: LOGIN_MAX_FAILED_ATTEMPTS - 1 });
      const handler = new LoginCommandHandler(mocks.deps);

      const before = Date.now();
      await handler
        .execute(new LoginCommand({ email: 'an@example.com', password: 'Nope1!' }))
        .catch(() => undefined);

      const data = updateData(mocks.user.update) as {
        accessFailedCount: number;
        lockedUntil: Date;
      };
      expect(data.accessFailedCount).toBe(0);
      expect(data.lockedUntil.getTime()).toBeGreaterThanOrEqual(
        before + LOGIN_LOCK_DURATION_MS - 5000,
      );
      expect(data.lockedUntil.getTime()).toBeLessThanOrEqual(
        Date.now() + LOGIN_LOCK_DURATION_MS + 5000,
      );
    });

    it('only increments the counter below the threshold', async () => {
      mocks = createMocks({ accessFailedCount: 2 });
      const handler = new LoginCommandHandler(mocks.deps);

      await handler
        .execute(new LoginCommand({ email: 'an@example.com', password: 'Nope1!' }))
        .catch(() => undefined);

      const data = updateData(mocks.user.update) as Record<string, unknown>;
      expect(data.accessFailedCount).toBe(3);
      expect(data.lockedUntil).toBeUndefined();
    });

    it('lets the user back in once the lockout has expired and clears the column', async () => {
      mocks = createMocks({ lockedUntil: new Date(Date.now() - 1000) });
      const handler = new LoginCommandHandler(mocks.deps);

      const result = await handler.execute(validCommand);

      expect(result.accessToken).toBe('signed-access-token');
      const data = updateData(mocks.user.update) as Record<string, unknown>;
      expect(data.lockedUntil).toBeNull();
      expect(data.accessFailedCount).toBe(0);
    });
  });

  describe('counter maintenance', () => {
    it('resets the failed count on a successful login', async () => {
      mocks = createMocks({ accessFailedCount: 3 });
      const handler = new LoginCommandHandler(mocks.deps);

      await handler.execute(validCommand);

      expect(updateData(mocks.user.update)).toMatchObject({
        accessFailedCount: 0,
        lockedUntil: null,
      });
    });

    it('rethrows unexpected database errors so they surface as a 500 (A4)', async () => {
      mocks.user.findUnique.mockRejectedValue(new Error('ECONNREFUSED 5432'));
      const handler = new LoginCommandHandler(mocks.deps);

      await expect(handler.execute(validCommand)).rejects.toThrow('ECONNREFUSED 5432');
    });
  });
});
