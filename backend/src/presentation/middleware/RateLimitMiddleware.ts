import rateLimit from 'express-rate-limit';

import { env } from '../../config-middleware/config/env.js';

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_GENERAL,
  message: {
    type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH,
  message: {
    type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_UPLOAD,
  message: {
    type: 'https://tools.ietf.org/html/rfc7807#section-3.1',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Upload rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});