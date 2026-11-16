import { RedisOptions } from 'ioredis';

import { env } from '../../config-middleware/config/env.js';

export function createQueueConnection(maxRetriesPerRequest: number | null = 1): RedisOptions {
  const redisUrl = new URL(env.REDIS_URL);
  const database = Number.parseInt(redisUrl.pathname.slice(1), 10);

  return {
    host: redisUrl.hostname,
    port: Number.parseInt(redisUrl.port, 10) || (redisUrl.protocol === 'rediss:' ? 6380 : 6379),
    ...(redisUrl.username ? { username: decodeURIComponent(redisUrl.username) } : {}),
    ...(redisUrl.password ? { password: decodeURIComponent(redisUrl.password) } : {}),
    ...(Number.isInteger(database) && database >= 0 ? { db: database } : {}),
    ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest,
  };
}
