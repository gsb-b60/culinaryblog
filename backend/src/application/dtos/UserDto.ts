import { UserRole } from '../../../domain/enums/UserRole.js';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface GoogleAuthInput {
  idToken: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}