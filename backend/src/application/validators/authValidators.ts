import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  displayName: z.string().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  bio: z.string().max(2000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;