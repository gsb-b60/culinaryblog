import { prisma } from '../../config-middleware/shared/database/client.js';
import { cacheService } from '../cache/RedisCacheService.js';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }>;
}

export class HealthCheckService {
  async checkAll(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const results: HealthCheckResult['checks'] = {
      database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason?.message },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason?.message },
    };

    const allHealthy = Object.values(results).every(c => c.status === 'healthy');
    const anyHealthy = Object.values(results).some(c => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  async checkLiveness(): Promise<{ status: 'alive' }> {
    return { status: 'alive' };
  }

  async checkReadiness(): Promise<HealthCheckResult> {
    return this.checkAll();
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