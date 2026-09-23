import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addMock, closeMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
  closeMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = addMock;

    close = closeMock;
  },
}));

vi.mock('ioredis', () => ({
  Redis: class MockRedis {
    disconnect(): void {}
  },
}));

import {
  closeWelcomeEmailQueue,
  enqueueWelcomeEmail,
} from '../src/infrastructure/queue/welcomeEmailQueue.js';

describe('welcomeEmailQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enqueues a "welcome" job fire-and-forget with 3 retries', () => {
    addMock.mockResolvedValue({ id: 'job-1' });

    enqueueWelcomeEmail({ userId: 'user-1', email: 'an@example.com' });

    expect(addMock).toHaveBeenCalledWith(
      'welcome',
      { userId: 'user-1', email: 'an@example.com' },
      expect.objectContaining({
        attempts: 3,
        backoff: expect.objectContaining({ type: 'exponential' }),
      }),
    );
  });

  it('never throws when Redis/queue add fails (registration must survive)', async () => {
    addMock.mockRejectedValue(new Error('redis down'));

    expect(() => enqueueWelcomeEmail({ userId: 'u', email: 'e@x.com' })).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(addMock).toHaveBeenCalled();
  });

  it('closes the queue connection', async () => {
    addMock.mockResolvedValue({});
    enqueueWelcomeEmail({ userId: 'u', email: 'e@x.com' });
    await closeWelcomeEmailQueue();
    expect(closeMock).toHaveBeenCalled();
  });
});
