process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5435/lethimcook';
process.env.REDIS_URL ??= 'redis://localhost:6377';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-xxxxxxxxxxxxxxxxxxxxxxxx';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-xxxxxxxxxxxxxxxxxxxxxxxx';
