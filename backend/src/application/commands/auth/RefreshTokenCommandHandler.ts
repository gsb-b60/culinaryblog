import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

import { logger } from '../../../config-middleware/config/logger.js';
import { UnauthorizedError } from '../../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../../command-bus.js';
import { AuthTokensDto } from '../../dtos/UserDto.js';
import { IJwtService } from '../../interfaces/IJwtService.js';

import { RefreshTokenCommand } from './AuthCommands.js';

const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

type RefreshResult =
  | { kind: 'success'; tokens: AuthTokensDto }
  | { kind: 'invalid' }
  | { kind: 'reuse'; userId: string };

export class RefreshTokenCommandHandler implements ICommandHandler<
  RefreshTokenCommand,
  AuthTokensDto
> {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: IJwtService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthTokensDto> {
    const tokenHash = this.jwtService.verifyRefreshToken(command.input.refreshToken);
    if (!tokenHash) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const result = await this.prisma.$transaction<RefreshResult>(async (transaction) => {
      const storedToken = await transaction.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!storedToken) {
        return { kind: 'invalid' };
      }

      const now = new Date();
      if (storedToken.isRevoked) {
        await transaction.refreshToken.updateMany({
          where: { userId: storedToken.userId, isRevoked: false },
          data: { isRevoked: true, revokedAt: now },
        });
        return { kind: 'reuse', userId: storedToken.userId };
      }

      if (
        storedToken.expiresAt <= now ||
        !storedToken.user.isActive ||
        storedToken.user.isDeleted
      ) {
        return { kind: 'invalid' };
      }

      const refreshToken = this.jwtService.generateRefreshToken();
      const newTokenHash = this.jwtService.verifyRefreshToken(refreshToken);
      if (!newTokenHash) {
        return { kind: 'invalid' };
      }

      const rotated = await transaction.refreshToken.updateMany({
        where: { id: storedToken.id, isRevoked: false, expiresAt: { gt: now } },
        data: {
          isRevoked: true,
          replacedByTokenHash: newTokenHash,
          revokedAt: now,
        },
      });

      if (rotated.count !== 1) {
        await transaction.refreshToken.updateMany({
          where: { userId: storedToken.userId, isRevoked: false },
          data: { isRevoked: true, revokedAt: now },
        });
        return { kind: 'reuse', userId: storedToken.userId };
      }

      const accessToken = this.jwtService.generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        roles: [storedToken.user.role],
        jti: randomUUID(),
      });

      await transaction.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.userId,
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
        },
      });

      return {
        kind: 'success',
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS,
        },
      };
    });

    if (result.kind === 'reuse') {
      logger.warn({ userId: result.userId }, 'Refresh token reuse detected; revoked active tokens');
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (result.kind === 'invalid') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    return result.tokens;
  }
}
