import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleAuthCommand } from '../src/application/commands/auth/AuthCommands.js';
import {
  GoogleAuthCommandHandler,
  type GoogleAuthHandlerDependencies,
  type GoogleProfile,
} from '../src/application/handlers/AuthCommandHandlers.js';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const validProfile: GoogleProfile = {
  sub: 'google-sub-123',
  email: 'Google.User@Example.com',
  emailVerified: true,
  name: 'Google User',
  picture: 'https://lh3.googleusercontent.com/a/pic.jpg',
};

const validCommand = new GoogleAuthCommand({ idToken: 'signed-google-token' });

function createMocks(googleClientId: string | undefined = 'client-id.apps.googleusercontent.com') {
  const user = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() };
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

  const verifyGoogleToken = vi.fn(async () => ({ ...validProfile }));
  const enqueueWelcomeEmail = vi.fn();

  const deps: GoogleAuthHandlerDependencies = {
    prisma,
    jwtService,
    googleClientId,
    verifyGoogleToken,
    enqueueWelcomeEmail,
    accessTokenTtlMs: ACCESS_TTL_MS,
    refreshTokenTtlMs: REFRESH_TTL_MS,
  };

  user.findUnique.mockResolvedValue(null);
  user.create.mockImplementation((args: { data: Record<string, unknown> }) =>
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
  user.update.mockImplementation(
    (args: { where: { id: string }; data: Record<string, unknown> }) =>
      Promise.resolve({ id: args.where.id, ...args.data }),
  );
  refreshToken.create.mockResolvedValue({});
  enqueueWelcomeEmail.mockResolvedValue(undefined);

  return { user, refreshToken, jwtService, verifyGoogleToken, enqueueWelcomeEmail, deps };
}

describe('GoogleAuthCommandHandler', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('creates a new AUTHOR account on first Google login with avatar and googleId (AC1, AC3)', async () => {
    const handler = new GoogleAuthCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    expect(mocks.verifyGoogleToken).toHaveBeenCalledWith('signed-google-token');
    expect(mocks.user.create).toHaveBeenCalledTimes(1);
    const createArgs = mocks.user.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      email: 'google.user@example.com',
      role: 'AUTHOR',
      googleId: 'google-sub-123',
      avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
      fullName: 'Google User',
      displayName: 'Google User',
      emailVerified: true,
    });
    expect(createArgs.data).not.toHaveProperty('passwordHash');

    expect(result).toMatchObject({
      accessToken: 'signed-access-token',
      refreshToken: expect.stringMatching(/^[0-9a-f]{128}$/),
      user: {
        email: 'google.user@example.com',
        fullName: 'Google User',
        userName: '',
        avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
        roles: ['AUTHOR'],
      },
    });

    const refreshArgs = mocks.refreshToken.create.mock.calls[0]?.[0] as {
      data: { userId: string; tokenHash: string };
    };
    expect(refreshArgs.data.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(mocks.enqueueWelcomeEmail).toHaveBeenCalledWith({
      email: 'google.user@example.com',
      displayName: 'Google User',
    });
  });

  it('links an existing manually registered email to Google without creating a duplicate (AC2)', async () => {
    const existing = {
      id: 'existing-user',
      email: 'google.user@example.com',
      userName: 'nguyenvana',
      fullName: 'Nguyen Van A',
      displayName: 'Nguyen Van A',
      avatarUrl: null,
      role: 'AUTHOR',
      googleId: null,
    };
    mocks.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    mocks.user.update.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...existing, ...args.data }),
    );

    const handler = new GoogleAuthCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    expect(mocks.user.create).not.toHaveBeenCalled();
    expect(mocks.user.update).toHaveBeenCalledWith({
      where: { id: 'existing-user' },
      data: {
        googleId: 'google-sub-123',
        avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
      },
    });
    expect(result.user).toMatchObject({
      userName: 'nguyenvana',
      fullName: 'Nguyen Van A',
      avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
      roles: ['AUTHOR'],
    });
    expect(mocks.enqueueWelcomeEmail).not.toHaveBeenCalled();
  });

  it('keeps a custom avatar when the linked account already has one (AC3)', async () => {
    const existing = {
      id: 'existing-user',
      email: 'google.user@example.com',
      userName: 'nguyenvana',
      fullName: 'Nguyen Van A',
      displayName: 'Nguyen Van A',
      avatarUrl: 'https://cdn.example.com/custom.jpg',
      role: 'AUTHOR',
      googleId: null,
    };
    mocks.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    mocks.user.update.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ ...existing, ...args.data }),
    );

    const handler = new GoogleAuthCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    const updateArgs = mocks.user.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(updateArgs.data.googleId).toBe('google-sub-123');
    expect(updateArgs.data).not.toHaveProperty('avatarUrl');
    expect(result.user.avatarUrl).toBe('https://cdn.example.com/custom.jpg');
  });

  it('signs in directly when the googleId is already linked', async () => {
    const linked = {
      id: 'linked-user',
      email: 'google.user@example.com',
      userName: null,
      fullName: 'Google User',
      displayName: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
      role: 'AUTHOR',
      googleId: 'google-sub-123',
    };
    mocks.user.findUnique.mockResolvedValueOnce(linked);

    const handler = new GoogleAuthCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    expect(mocks.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.user.create).not.toHaveBeenCalled();
    expect(mocks.user.update).not.toHaveBeenCalled();
    expect(result.user.id).toBe('linked-user');
  });

  it('throws 401 AUTH_GOOGLE_INVALID_TOKEN for an invalid Google token (AC4)', async () => {
    mocks.verifyGoogleToken.mockRejectedValue(new Error('invalid signature'));

    const handler = new GoogleAuthCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 401,
      code: 'AUTH_GOOGLE_INVALID_TOKEN',
      type: 'AUTH_GOOGLE_INVALID_TOKEN',
      title: 'Unauthorized',
    });
    expect(mocks.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws 400 AUTH_GOOGLE_INVALID_PROFILE when the profile has no email (AC5)', async () => {
    mocks.verifyGoogleToken.mockResolvedValue({ ...validProfile, email: '' });

    const handler = new GoogleAuthCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 400,
      code: 'AUTH_GOOGLE_INVALID_PROFILE',
      title: 'Bad Request',
    });
  });

  it('throws 400 AUTH_GOOGLE_UNVERIFIED_EMAIL when Google did not verify the email (AC5)', async () => {
    mocks.verifyGoogleToken.mockResolvedValue({ ...validProfile, emailVerified: false });

    const handler = new GoogleAuthCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 400,
      code: 'AUTH_GOOGLE_UNVERIFIED_EMAIL',
    });
  });

  it('throws 502 AUTH_GOOGLE_UNAVAILABLE when the Google API is unreachable (AC6)', async () => {
    mocks.verifyGoogleToken.mockRejectedValue(new Error('fetch failed'));

    const handler = new GoogleAuthCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 502,
      code: 'AUTH_GOOGLE_UNAVAILABLE',
      title: 'Bad Gateway',
    });
    expect(mocks.user.findUnique).not.toHaveBeenCalled();
  });

  it('throws 503 AUTH_GOOGLE_NOT_CONFIGURED when GOOGLE_CLIENT_ID is missing', async () => {
    const handler = new GoogleAuthCommandHandler({
      ...createMocks().deps,
      googleClientId: undefined,
    });

    await expect(handler.execute(validCommand)).rejects.toMatchObject({
      statusCode: 503,
      code: 'AUTH_GOOGLE_NOT_CONFIGURED',
    });
  });

  it('still succeeds when enqueueWelcomeEmail throws (fire-and-forget)', async () => {
    mocks.enqueueWelcomeEmail.mockImplementation(() => {
      throw new Error('redis down');
    });
    const handler = new GoogleAuthCommandHandler(mocks.deps);

    const result = await handler.execute(validCommand);
    expect(result.accessToken).toBe('signed-access-token');
  });

  it('recovers when a concurrent request wins the unique-violation race', async () => {
    const winner = {
      id: 'race-winner',
      email: 'google.user@example.com',
      userName: null,
      fullName: 'Google User',
      displayName: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/pic.jpg',
      role: 'AUTHOR',
      googleId: 'google-sub-123',
    };
    mocks.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    mocks.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

    const handler = new GoogleAuthCommandHandler(mocks.deps);
    const result = await handler.execute(validCommand);

    expect(result.user.id).toBe('race-winner');
    expect(mocks.enqueueWelcomeEmail).not.toHaveBeenCalled();
  });

  it('rethrows non-unique-violation create errors', async () => {
    mocks.user.create.mockRejectedValue(new Error('disk full'));
    const handler = new GoogleAuthCommandHandler(mocks.deps);

    await expect(handler.execute(validCommand)).rejects.toThrow('disk full');
  });
});
