import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../../config-middleware/config/env.js';
import { prisma } from '../../config-middleware/shared/database/client.js';
import { cacheService } from '../cache/RedisCacheService.js';

export interface HealthCheckResult {
  status: 'Healthy' | 'Unhealthy' | 'Degraded';
  timestamp: string;
  entries: Record<string, { status: 'Healthy' | 'Unhealthy'; latency?: number; error?: string }>;
}

export class HealthCheckService {
  async checkAll(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMinio(),
    ]);

    const entries: HealthCheckResult['entries'] = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'Unhealthy', error: checks[0].reason?.message },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'Unhealthy', error: checks[1].reason?.message },
      minio: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'Unhealthy', error: checks[2].reason?.message },
    };

    const allHealthy = Object.values(entries).every(entry => entry.status === 'Healthy');
    const anyHealthy = Object.values(entries).some(entry => entry.status === 'Healthy');

    return {
      status: allHealthy ? 'Healthy' : anyHealthy ? 'Degraded' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      entries,
    };
  }

  async checkLiveness(): Promise<{ status: 'Healthy' }> {
    return { status: 'Healthy' };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis()]);
    const entries: HealthCheckResult['entries'] = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'Unhealthy', error: checks[0].reason?.message },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'Unhealthy', error: checks[1].reason?.message },
    };

    return {
      status: Object.values(entries).every(entry => entry.status === 'Healthy') ? 'Healthy' : 'Unhealthy',
      timestamp: new Date().toISOString(),
      entries,
    };
  }

  private async checkDatabase(): Promise<{ status: 'Healthy' | 'Unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'Healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'Unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkRedis(): Promise<{ status: 'Healthy' | 'Unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    try {
      if (!cacheService.isReady()) {
        return { status: 'Unhealthy', latency: Date.now() - start, error: 'Not connected' };
      }
      await cacheService.get('health-check');
      return { status: 'Healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'Unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkMinio(): Promise<{ status: 'Healthy' | 'Unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      return { status: 'Unhealthy', latency: Date.now() - start, error: 'MinIO is not configured' };
    }

    try {
      const client = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
        forcePathStyle: true,
      });
      await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
      return { status: 'Healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'Unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const healthCheckService = new HealthCheckService();