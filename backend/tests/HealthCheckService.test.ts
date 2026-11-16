import { HealthCheckService } from '../src/infrastructure/health/HealthCheckService.js';

describe('HealthCheckService', () => {
  it('reports liveness independently of dependency health', async () => {
    const service = new HealthCheckService({
      database: async () => { throw new Error('database unavailable'); },
      redis: async () => { throw new Error('redis unavailable'); },
      minio: async () => { throw new Error('minio unavailable'); },
    });

    await expect(service.checkLiveness()).resolves.toEqual({ status: 'Healthy' });
  });

  it('uses only database and Redis for readiness', async () => {
    const service = new HealthCheckService({
      database: async () => undefined,
      redis: async () => undefined,
      minio: async () => { throw new Error('MinIO unavailable'); },
    });

    await expect(service.checkReadiness()).resolves.toMatchObject({
      status: 'Healthy',
      entries: {
        database: { status: 'Healthy' },
        redis: { status: 'Healthy' },
      },
    });
  });

  it('fails readiness when a required dependency is unavailable', async () => {
    const service = new HealthCheckService({
      database: async () => undefined,
      redis: async () => { throw new Error('Redis unavailable'); },
      minio: async () => undefined,
    });

    await expect(service.checkReadiness()).resolves.toMatchObject({
      status: 'Unhealthy',
      entries: { redis: { status: 'Unhealthy', error: 'Dependency unavailable' } },
    });
  });

  it('includes MinIO in aggregate health without making it a readiness dependency', async () => {
    const service = new HealthCheckService({
      database: async () => undefined,
      redis: async () => undefined,
      minio: async () => { throw new Error('MinIO unavailable'); },
    });

    await expect(service.checkAll()).resolves.toMatchObject({
      status: 'Degraded',
      entries: { minio: { status: 'Unhealthy', error: 'Dependency unavailable' } },
    });
  });
});
