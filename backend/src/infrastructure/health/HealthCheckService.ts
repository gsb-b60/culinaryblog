import { env } from '../../config-middleware/config/env.js';
import { prisma } from '../../config-middleware/shared/database/client.js';
import { cacheService } from '../cache/RedisCacheService.js';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }>;
}

export interface HealthCheckResponse {
  status: 'Healthy' | 'Unhealthy';
  entries: Record<string, { status: 'Healthy' | 'Unhealthy'; latency?: number; error?: string }>;
  timestamp: string;
}

export class HealthCheckService {
  async checkAll(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMinio(),
    ]);

    const results: HealthCheckResult['checks'] = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason?.message },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason?.message },
      minio: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy', error: checks[2].reason?.message },
    };

    const healthy = Object.values(results).every((check) => check.status === 'healthy');

    return {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  async checkLiveness(): Promise<{ status: 'alive' }> {
    return { status: 'alive' };
  }

  toResponse(result: HealthCheckResult): HealthCheckResponse {
    return {
      status: result.status === 'healthy' ? 'Healthy' : 'Unhealthy',
      timestamp: result.timestamp,
      entries: Object.fromEntries(
        Object.entries(result.checks).map(([name, check]) => [name, {
          ...check,
          status: check.status === 'healthy' ? 'Healthy' : 'Unhealthy',
        }]),
      ),
    };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis()]);
    const results: HealthCheckResult['checks'] = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason?.message },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason?.message },
    };
    const healthy = Object.values(results).every((check) => check.status === 'healthy');
    return { status: healthy ? 'healthy' : 'unhealthy', timestamp: new Date().toISOString(), checks: results };
  }

  private async checkMinio(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    if (!env.S3_ENDPOINT || !env.S3_BUCKET) {
      return { status: 'unhealthy', latency: Date.now() - start, error: 'S3 storage is not configured' };
    }
    try {
      const response = await fetch(`${env.S3_ENDPOINT.replace(/\/$/, '')}/minio/health/live`);
      if (!response.ok) throw new Error(`MinIO health returned ${response.status}`);
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkDatabase(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async checkRedis(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    const start = Date.now();
    try {
      if (!cacheService.isReady()) {
        return { status: 'unhealthy', latency: Date.now() - start, error: 'Not connected' };
      }
      await cacheService.get('health-check');
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const healthCheckService = new HealthCheckService();