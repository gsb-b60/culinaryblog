import { randomUUID } from 'crypto';

import { PrismaClient, User } from '@prisma/client';

import { logger } from '../../config-middleware/config/logger.js';
import { AppError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../command-bus.js';
import { RegisterCommand } from '../commands/auth/AuthCommands.js';
import { AuthResponseDto } from '../dtos/UserDto.js';
import { IJwtService } from '../interfaces/IJwtService.js';

export interface RegisterHandlerDependencies {
  prisma: PrismaClient;
  jwtService: IJwtService;
  hashPassword: (password: string) => Promise<string>;
  enqueueWelcomeEmail: (data: { email: string; displayName: string }) => Promise<void>;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === 'P2002';
}

function uniqueViolationFields(error: unknown): string[] {
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  return target ? [String(target)] : [];
}

function conflictError(message: string, code: string): AppError {
  return new AppError(409, message, code, { type: code, title: 'Conflict' });
}

export class RegisterCommandHandler implements ICommandHandler<RegisterCommand, AuthResponseDto> {
  constructor(private readonly deps: RegisterHandlerDependencies) {}

  async execute(command: RegisterCommand): Promise<AuthResponseDto> {
    const { fullName, email, userName, password } = command.input;

    const existingUser = await this.deps.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw conflictError('Email already registered', 'AUTH_EMAIL_EXISTS');
    }

    let passwordHash: string;
    try {
      passwordHash = await this.deps.hashPassword(password);
    } catch {
      throw new ValidationError({ password: ['Failed to process the password'] });
    }

    let user: User;
    try {
      user = await this.deps.prisma.user.create({
        data: {
          id: randomUUID(),
          fullName,
          userName,
          email,
          passwordHash,
          displayName: fullName,
          role: 'AUTHOR',
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const fields = uniqueViolationFields(error);
        if (fields.some((field) => field.includes('email'))) {
          throw conflictError('Email already registered', 'AUTH_EMAIL_EXISTS');
        }
        if (fields.some((field) => field.includes('user_name'))) {
          throw conflictError('Username already taken', 'AUTH_USERNAME_EXISTS');
        }
      }
      throw error;
    }

    const roles = [user.role];
    const accessToken = this.deps.jwtService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles,
      jti: randomUUID(),
    });
    const refreshToken = this.deps.jwtService.generateRefreshToken();

    await this.deps.prisma.refreshToken.create({
      data: {
        tokenHash: this.deps.jwtService.hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + this.deps.refreshTokenTtlMs),
      },
    });

    try {
      await this.deps.enqueueWelcomeEmail({ email: user.email, displayName: user.displayName });
    } catch (error) {
      logger.warn({ err: error }, 'Failed to enqueue welcome email');
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.deps.accessTokenTtlMs).toISOString(),
      user: {
        id: user.id,
        fullName,
        email: user.email,
        userName,
        avatarUrl: user.avatarUrl ?? undefined,
        roles,
      },
    };
  }
}
