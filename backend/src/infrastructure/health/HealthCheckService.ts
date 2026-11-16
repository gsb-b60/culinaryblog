import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../../config-middleware/config/env.js';
import { logger } from '../../config-middleware/config/logger.js';
import { prisma } from '../../config-middleware/shared/database/client.js';
import { cacheService } from '../cache/RedisCacheService.js';

type DependencyStatus = {
  status: 'Healthy' | 'Unhealthy';
  latency?: number;
  error?: string;
};

export interface HealthCheckResult {
  status: 'Healthy' | 'Unhealthy' | 'Degraded';
  timestamp: string;
  entries: Record<string, DependencyStatus>;
}

export interface HealthCheckDependencies {
  database?: () => Promise<unknown>;
  redis?: () => Promise<void>;
  minio?: () => Promise<void>;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, dependency: string): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(`${dependency} health check timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export class HealthCheckService {
  private readonly databaseCheck: () => Promise<unknown>;

  private readonly redisCheck: () => Promise<void>;

  private readonly minioCheck: () => Promise<void>;

  constructor(dependencies: HealthCheckDependencies = {}) {
    this.databaseCheck = dependencies.database ?? (() => prisma.$queryRaw`SELECT 1`);
    this.redisCheck = dependencies.redis ?? (() => cacheService.ping());
    this.minioCheck = dependencies.minio ?? (() => this.checkMinio());
  }

  async checkAll(): Promise<HealthCheckResult> {
    const [database, redis, minio] = await Promise.all([
      this.checkDependency('database', this.databaseCheck),
      this.checkDependency('redis', this.redisCheck),
      this.checkDependency('minio', this.minioCheck),
    ]);
    const entries = { database, redis, minio };
    const healthyCount = Object.values(entries).filter(entry => entry.status === 'Healthy').length;

    return {
      status: healthyCount === 3 ? 'Healthy' : healthyCount > 0 ? 'Degraded' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      entries,
    };
  }

  async checkLiveness(): Promise<{ status: 'Healthy' }> {
    return { status: 'Healthy' };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    const [database, redis] = await Promise.all([
      this.checkDependency('database', this.databaseCheck),
      this.checkDependency('redis', this.redisCheck),
    ]);
    const entries = { database, redis };

    return {
      status: Object.values(entries).every(entry => entry.status === 'Healthy')
        ? 'Healthy'
        : 'Unhealthy',
      timestamp: new Date().toISOString(),
      entries,
    };
  }

  private async checkDependency(
    name: string,
    check: () => Promise<unknown>,
  ): Promise<DependencyStatus & { latency: number }> {
    const startedAt = performance.now();
    try {
      await withTimeout(check(), env.HEALTH_CHECK_TIMEOUT_MS, name);
      return { status: 'Healthy', latency: Math.round(performance.now() - startedAt) };
    } catch (error) {
      logger.warn({
        dependency: name,
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }, 'Health dependency check failed');
      return {
        status: 'Unhealthy',
        latency: Math.round(performance.now() - startedAt),
        error: 'Dependency unavailable',
      };
    }
  }

  private async checkMinio(): Promise<void> {
    if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new Error('MinIO is not configured');
    }

    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
      forcePathStyle: true,
      maxAttempts: 1,
    });

    try {
      await client.send(
        new HeadBucketCommand({ Bucket: env.S3_BUCKET }),
        { abortSignal: AbortSignal.timeout(env.HEALTH_CHECK_TIMEOUT_MS) },
      );
    } finally {
      client.destroy();
    }
  }
}

export const healthCheckService = new HealthCheckService();
