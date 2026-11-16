import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const defaultLogLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default(defaultLogLevel),
  LOG_DIRECTORY: z.string().default('logs'),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(14),
  SEQ_URL: z.string().url().optional(),
  SEQ_API_KEY: z.string().optional(),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SITEMAP_BASE_URL: z.string().url().default('http://localhost:5173'),
  SITEMAP_OUTPUT_DIR: z.string().default('wwwroot'),
  GOOGLE_SITEMAP_PING_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  OTEL_SERVICE_NAME: z.string().default('lethimcook-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.string().url().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_GENERAL: z.coerce.number().default(100),
  RATE_LIMIT_AUTH: z.coerce.number().default(10),
  RATE_LIMIT_PASSWORD_RESET: z.coerce.number().default(5),
  RATE_LIMIT_UPLOAD: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
