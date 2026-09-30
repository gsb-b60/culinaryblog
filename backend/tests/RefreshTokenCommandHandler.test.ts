import { describe, expect, it, vi } from 'vitest';

import { RefreshTokenCommand } from '../src/application/commands/auth/AuthCommands.js';
import { RefreshTokenCommandHandler } from '../src/application/commands/auth/RefreshTokenCommandHandler.js';
import { IJwtService } from '../src/application/interfaces/IJwtService.js';
import { UnauthorizedError } from '../src/config-middleware/shared/errors/AppError.js';

function createHarness(overrides: Record<string, unknown> = {}, updateManyCounts: number[] = [1]) {
  const storedToken = {
    id: 'old-id',
    tokenHash: 'old-hash',
    userId: 'user-id',
    expiresAt: new Date(Date.now() + 60_000),
    isRevoked: false,
    user: {
      id: 'user-id',
      email: 'author@example.com',
      role: 'AUTHOR',
      isActive: true,
      isDeleted: false,
    },
    ...overrides,
  };
  const transaction = {
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(storedToken),
      updateMany: vi
        .fn()
        .mockImplementation(() => Promise.resolve({ count: updateManyCounts.shift() ?? 1 })),
      create: vi.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)),
  };
  const jwtService: IJwtService = {
    generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
    verifyAccessToken: vi.fn().mockReturnValue(null),
    verifyRefreshToken: vi.fn((token: string) => `${token}-hash`),
    decodeToken: vi.fn().mockReturnValue(null),
  };
  const handler = new RefreshTokenCommandHandler(prisma as never, jwtService);

  return { handler, transaction, jwtService };
}

describe('RefreshTokenCommandHandler', () => {
  it('rotates a valid token and persists only the replacement hash', async () => {
    const { handler, transaction, jwtService } = createHarness();

    const result = await handler.execute(new RefreshTokenCommand({ refreshToken: 'old-token' }));

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 900,
    });
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'old-id', isRevoked: false, expiresAt: { gt: expect.any(Date) } },
        data: expect.objectContaining({
          isRevoked: true,
          replacedByTokenHash: 'new-refresh-token-hash',
          revokedAt: expect.any(Date),
        }),
      }),
    );
    expect(transaction.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokenHash: 'new-refresh-token-hash', userId: 'user-id' }),
    });
    expect(jwtService.verifyRefreshToken).toHaveBeenCalledWith('old-token');
  });

  it('rejects expired refresh tokens', async () => {
    const { handler, transaction } = createHarness({ expiresAt: new Date(Date.now() - 1) });

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'old-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects tokens that do not exist in storage', async () => {
    const { handler, transaction } = createHarness();
    transaction.refreshToken.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'unknown-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });

  it.each([
    ['inactive', { isActive: false, isDeleted: false }],
    ['deleted', { isActive: true, isDeleted: true }],
  ])('rejects tokens belonging to a %s user', async (_state, userState) => {
    const { handler, transaction } = createHarness({
      user: {
        id: 'user-id',
        email: 'author@example.com',
        role: 'AUTHOR',
        ...userState,
      },
    });

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'old-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rejects a token when hashing does not produce a database key', async () => {
    const { handler, transaction, jwtService } = createHarness();
    vi.mocked(jwtService.verifyRefreshToken).mockReturnValueOnce(null);

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'malformed-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.findUnique).not.toHaveBeenCalled();
  });

  it('revokes active user tokens and rejects reuse of a revoked token', async () => {
    const { handler, transaction } = createHarness({ isRevoked: true });

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'old-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', isRevoked: false },
      data: expect.objectContaining({ isRevoked: true, revokedAt: expect.any(Date) }),
    });
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });

  it('treats a concurrent rotation as reuse and revokes remaining active tokens', async () => {
    const { handler, transaction } = createHarness({}, [0, 1]);

    await expect(
      handler.execute(new RefreshTokenCommand({ refreshToken: 'old-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(transaction.refreshToken.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: 'user-id', isRevoked: false },
        data: expect.objectContaining({ isRevoked: true, revokedAt: expect.any(Date) }),
      }),
    );
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });
});
