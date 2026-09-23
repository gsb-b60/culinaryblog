import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import {
  AppError,
  ConflictError,
  ValidationError,
} from '../../../config-middleware/shared/errors/AppError.js';

import type { RegisterCommand } from './RegisterCommand.js';

export interface AuthUserDto {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  avatarUrl: string | null;
  roles: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUserDto;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface SignedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface WelcomeEmailJob {
  userId: string;
  email: string;
}

export interface RegisterHandlerDeps {
  prisma: PrismaClient;
  hashPassword: (plain: string) => Promise<string>;
  signAccessToken: (payload: AccessTokenPayload) => SignedAccessToken;
  generateRefreshToken: () => string;
  hashToken: (rawToken: string) => string;
  enqueueWelcomeEmail: (job: WelcomeEmailJob) => void;
  refreshTokenTtlMs: number;
}

const AUTHOR_ROLE = 'Author';

function isUniqueViolation(
  err: unknown,
): err is { meta?: { target?: string | string[] } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 'P2002'
  );
}

function conflictFromUniqueViolation(
  err: { meta?: { target?: string | string[] } },
): ConflictError {
  const target = err.meta?.target;
  const fields = Array.isArray(target) ? target : target ? [target] : [];
  if (fields.some((field) => field.includes('email'))) {
    return new ConflictError('Email already registered', 'AUTH_EMAIL_EXISTS');
  }
  if (fields.some((field) => field.includes('user_name'))) {
    return new ConflictError('User name already exists', 'AUTH_USERNAME_EXISTS');
  }
  return new ConflictError('Resource already exists');
}

export class RegisterCommandHandler {
  constructor(private readonly deps: RegisterHandlerDeps) {}

  async execute(command: RegisterCommand): Promise<AuthResponseDto> {
    const { fullName, email, userName, password } = command;

    const existing = await this.deps.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError('Email already registered', 'AUTH_EMAIL_EXISTS');
    }

    let passwordHash: string;
    try {
      passwordHash = await this.deps.hashPassword(password);
    } catch {
      throw new ValidationError({
        password: ['Failed to process the password'],
      });
    }

    const authorRole = await this.deps.prisma.role.findUnique({
      where: { name: AUTHOR_ROLE },
    });
    if (!authorRole) {
      throw new AppError(
        500,
        'Author role is not configured — run the database seed',
        'INTERNAL_ERROR',
      );
    }

    const userId = randomUUID();
    try {
      await this.deps.prisma.$transaction([
        this.deps.prisma.user.create({
          data: { id: userId, fullName, email, userName, passwordHash },
        }),
        this.deps.prisma.userRole.create({
          data: { userId, roleId: authorRole.id },
        }),
      ]);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflictFromUniqueViolation(err);
      }
      throw err;
    }

    const roles = [AUTHOR_ROLE];
    const accessToken = this.deps.signAccessToken({ sub: userId, email, roles });
    const rawRefreshToken = this.deps.generateRefreshToken();
    await this.deps.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.deps.hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + this.deps.refreshTokenTtlMs),
      },
    });

    try {
      this.deps.enqueueWelcomeEmail({ userId, email });
    } catch {
      // Fire-and-forget: a queue failure must never fail registration.
    }

    return {
      accessToken: accessToken.token,
      refreshToken: rawRefreshToken,
      expiresAt: accessToken.expiresAt.toISOString(),
      user: {
        id: userId,
        fullName,
        email,
        userName,
        avatarUrl: null,
        roles,
      },
    };
  }
}
