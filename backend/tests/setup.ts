process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.RATE_LIMIT_AUTH = '10000';
process.env.RATE_LIMIT_GENERAL = '10000';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-min-32-chars-xxxxxxxx';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-min-32-chars-xxxxxxxx';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/lethimcook';
process.env.REDIS_URL ??= 'redis://localhost:6379';
