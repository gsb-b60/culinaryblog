import { createHash, randomUUID } from 'crypto';

import { PrismaClient, User } from '@prisma/client';

import { logger } from '../../config-middleware/config/logger.js';
import { AppError, UnauthorizedError, ValidationError } from '../../config-middleware/shared/errors/AppError.js';
import { ICommandHandler } from '../command-bus.js';
import {
  GoogleAuthCommand,
  LoginCommand,
  LogoutCommand,
  RefreshTokenCommand,
  RegisterCommand,
} from '../commands/auth/AuthCommands.js';
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

function authError(status: number, message: string, code: string, title: string): AppError {
  return new AppError(status, message, code, { type: code, title });
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

export interface RefreshTokenHandlerDependencies {
  prisma: PrismaClient;
  jwtService: IJwtService;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
}

function refreshError(message: string, code: string): AppError {
  return new AppError(401, message, code, { type: code, title: 'Unauthorized' });
}

function toAuthResponse(user: User, accessToken: string, refreshToken: string, accessTokenTtlMs: number): AuthResponseDto {
  return {
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + accessTokenTtlMs).toISOString(),
    user: {
      id: user.id,
      fullName: user.fullName ?? user.displayName,
      email: user.email,
      userName: user.userName ?? '',
      avatarUrl: user.avatarUrl ?? undefined,
      roles: [user.role],
    },
  };
}

export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand, AuthResponseDto> {
  constructor(private readonly deps: RefreshTokenHandlerDependencies) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResponseDto> {
    const tokenHash = this.deps.jwtService.hashRefreshToken(command.input.refreshToken);
    const storedToken = await this.deps.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw refreshError('Invalid refresh token', 'AUTH_REFRESH_INVALID');
    }

    if (storedToken.revokedAt) {
      const revokedAt = new Date();
      await this.deps.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt },
      });
      logger.warn({ event: 'refresh_token_reuse', userId: storedToken.userId }, 'Refresh token reuse detected');
      throw refreshError('Refresh token has been revoked', 'AUTH_REFRESH_REUSED');
    }

    if (storedToken.expiresAt <= new Date()) {
      throw refreshError('Refresh token has expired', 'AUTH_REFRESH_EXPIRED');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      throw refreshError('User account is inactive', 'AUTH_REFRESH_USER_INACTIVE');
    }

    const newRefreshToken = this.deps.jwtService.generateRefreshToken();
    const newTokenHash = this.deps.jwtService.hashRefreshToken(newRefreshToken);
    const now = new Date();
    const newAccessToken = this.deps.jwtService.generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      roles: [storedToken.user.role],
      jti: randomUUID(),
    });

    await this.deps.prisma.$transaction([
      this.deps.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: now, replacedByTokenHash: newTokenHash },
      }),
      this.deps.prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.user.id,
          expiresAt: new Date(now.getTime() + this.deps.refreshTokenTtlMs),
        },
      }),
    ]);

    return toAuthResponse(storedToken.user, newAccessToken, newRefreshToken, this.deps.accessTokenTtlMs);
  }
}

export interface LogoutHandlerDependencies {
  prisma: PrismaClient;
}

export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(private readonly deps: LogoutHandlerDependencies) {}

  async execute(command: LogoutCommand): Promise<void> {
    if (!command.refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = createHash('sha256').update(command.refreshToken).digest('hex');
    const storedToken = await this.deps.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!storedToken || storedToken.userId !== command.userId || storedToken.revokedAt) {
      return;
    }

    await this.deps.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }
}

/** Consecutive failures allowed before the account is temporarily locked (FR-AUTH-002 A3). */
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;

/** How long the temporary lock lasts. */
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LoginHandlerDependencies {
  prisma: PrismaClient;
  jwtService: IJwtService;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
}

// A valid bcrypt hash of a value nobody knows. Used to burn the same amount
// of CPU on an unknown email as on a real one, so response timing does not
// reveal whether an account exists (FR-AUTH-002 A1).
const TIMING_EQUALIZER_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO1s2bUwvN5QOKjZBtSjJmYb0mHlB2oKzG';

const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect';

export class LoginCommandHandler implements ICommandHandler<LoginCommand, AuthResponseDto> {
  constructor(private readonly deps: LoginHandlerDependencies) {}

  async execute(command: LoginCommand): Promise<AuthResponseDto> {
    const { email, password } = command.input;

    const user = await this.deps.prisma.user.findUnique({ where: { email } });

    if (!user) {
      await this.deps.verifyPassword(password, TIMING_EQUALIZER_HASH);
      throw authError(
        401,
        INVALID_CREDENTIALS_MESSAGE,
        'AUTH_INVALID_CREDENTIALS',
        'Unauthorized',
      );
    }

    if (!user.passwordHash) {
      // Google-only account: there is no local password to compare against.
      throw authError(
        401,
        INVALID_CREDENTIALS_MESSAGE,
        'AUTH_INVALID_CREDENTIALS',
        'Unauthorized',
      );
    }

    const passwordMatches = await this.deps.verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedAttempt(user);
      throw authError(
        401,
        INVALID_CREDENTIALS_MESSAGE,
        'AUTH_INVALID_CREDENTIALS',
        'Unauthorized',
      );
    }

    if (!user.isActive) {
      throw authError(403, 'This account has been disabled', 'AUTH_ACCOUNT_DISABLED', 'Forbidden');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      throw authError(
        403,
        'Too many failed login attempts. Try again later.',
        'AUTH_ACCOUNT_LOCKED',
        'Forbidden',
      );
    }

    await this.deps.prisma.user.update({
      where: { id: user.id },
      data: { accessFailedCount: 0, lockedUntil: null },
    });

    // Every previous refresh token is marked as used rather than deleted, so
    // reuse of an old token stays detectable (FR-AUTH-002, token rotation).
    await this.deps.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    });

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

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.deps.accessTokenTtlMs).toISOString(),
      user: {
        id: user.id,
        fullName: user.fullName ?? user.displayName,
        email: user.email,
        userName: user.userName ?? '',
        avatarUrl: user.avatarUrl ?? undefined,
        roles,
      },
    };
  }

  private async recordFailedAttempt(user: User): Promise<void> {
    const attempts = user.accessFailedCount + 1;

    if (attempts >= LOGIN_MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
      await this.deps.prisma.user.update({
        where: { id: user.id },
        data: { accessFailedCount: 0, lockedUntil },
      });
      logger.warn(
        { userId: user.id, lockedUntil },
        'Account temporarily locked after too many failed logins',
      );
      return;
    }

    await this.deps.prisma.user.update({
      where: { id: user.id },
      data: { accessFailedCount: attempts },
    });
  }
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}
export interface GoogleAuthHandlerDependencies {
  prisma: PrismaClient;
  jwtService: IJwtService;
  googleClientId: string | undefined;
  verifyGoogleToken: (idToken: string) => Promise<GoogleProfile>;
  enqueueWelcomeEmail: (data: { email: string; displayName: string }) => Promise<void>;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
}

const GOOGLE_NETWORK_ERROR_PATTERN =
  /fetch failed|network|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|EAI_AGAIN|getaddrinfo|socket hang up|unable to fetch|request to/i;

export class GoogleAuthCommandHandler implements ICommandHandler<GoogleAuthCommand, AuthResponseDto> {
  constructor(private readonly deps: GoogleAuthHandlerDependencies) {}

  async execute(command: GoogleAuthCommand): Promise<AuthResponseDto> {
    if (!this.deps.googleClientId) {
      throw authError(
        503,
        'Google login is not configured',
        'AUTH_GOOGLE_NOT_CONFIGURED',
        'Service Unavailable',
      );
    }

    let profile: GoogleProfile;
    try {
      profile = await this.deps.verifyGoogleToken(command.input.idToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (GOOGLE_NETWORK_ERROR_PATTERN.test(message)) {
        throw authError(
          502,
          'Google authentication service is unavailable',
          'AUTH_GOOGLE_UNAVAILABLE',
          'Bad Gateway',
        );
      }
      throw authError(
        401,
        'Invalid or expired Google token',
        'AUTH_GOOGLE_INVALID_TOKEN',
        'Unauthorized',
      );
    }

    if (!profile.sub || !profile.email) {
      throw authError(
        400,
        'Google profile did not include an email',
        'AUTH_GOOGLE_INVALID_PROFILE',
        'Bad Request',
      );
    }
    if (!profile.emailVerified) {
      throw authError(
        400,
        'Google email address is not verified',
        'AUTH_GOOGLE_UNVERIFIED_EMAIL',
        'Bad Request',
      );
    }

    const email = profile.email.trim().toLowerCase();
    const user = await this.resolveUser(profile, email);

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

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.deps.accessTokenTtlMs).toISOString(),
      user: {
        id: user.id,
        fullName: user.fullName ?? user.displayName,
        email: user.email,
        userName: user.userName ?? '',
        avatarUrl: user.avatarUrl ?? undefined,
        roles,
      },
    };
  }

  /**
   * Resolves the account for a verified Google identity.
   *
   * No account is created here. A Google identity is only ever *linked* to an
   * account that already exists, matched by googleId first and then by email.
   * An unknown identity is rejected so the UI can send the user to sign up.
   */
  private async resolveUser(profile: GoogleProfile, email: string): Promise<User> {
    const linked = await this.deps.prisma.user.findUnique({ where: { googleId: profile.sub } });
    if (linked) {
      return linked;
    }

    const existing = await this.deps.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return this.deps.prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: profile.sub,
          ...(existing.avatarUrl ? {} : profile.picture ? { avatarUrl: profile.picture } : {}),
        },
      });
    }

    throw authError(
      403,
      'No account exists for this Google identity. Register with this email first.',
      'AUTH_ACCOUNT_NOT_REGISTERED',
      'Forbidden',
    );
  }
}
