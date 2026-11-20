import { Redis } from 'ioredis';

import { env } from '../../config-middleware/config/env.js';
import { logger } from '../../config-middleware/config/logger.js';

class RedisCacheService {
  private client: Redis | null = null;

  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error({ err }, 'Redis connection error');
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache delete error');
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.warn({ err: error, pattern }, 'Cache delete pattern error');
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      return await this.client.exists(key) === 1;
    } catch {
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const cacheService = new RedisCacheService();