import { z } from 'zod';

export const registerCommandSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be at most 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .max(256, 'Email must be at most 256 characters'),
  userName: z
    .string()
    .trim()
    .min(3, 'User name must be at least 3 characters')
    .max(30, 'User name must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'User name may only contain letters, numbers and underscores',
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
});

export type RegisterCommandInput = z.infer<typeof registerCommandSchema>;
