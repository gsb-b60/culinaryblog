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

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
    this.client.on('error', () => {
      this.isConnected = false;
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      throw error;
    }
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
      return data ? JSON.parse(data) as T : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      const serialized = JSON.stringify(value);
      if (serialized !== undefined) await this.client.setex(key, ttlSeconds, serialized);
    } catch (error) {
      logger.error({ err: error }, 'Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error({ err: error }, 'Cache delete error');
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
      logger.error({ err: error }, 'Cache delete pattern error');
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

  async ping(): Promise<void> {
    if (!this.client || !this.isConnected) throw new Error('Redis is not ready');
    const response = await this.client.ping();
    if (response !== 'PONG') throw new Error('Redis ping returned an unexpected response');
  }
}

export const cacheService = new RedisCacheService();