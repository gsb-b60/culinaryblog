import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.fn();
const sendWelcomeEmail = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = { findUnique };
    async $disconnect(): Promise<void> {}
  },
}));

vi.mock('../src/infrastructure/email/NodemailerEmailService.js', () => ({
  emailService: { sendWelcomeEmail },
}));

vi.mock('bullmq', () => ({
  Worker: class {
    on(): this { return this; }
    async close(): Promise<void> {}
  },
}));

describe('welcome email worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ displayName: 'Integration cook' });
    sendWelcomeEmail.mockResolvedValue(undefined);
  });

  it('loads the display name from the user id payload before sending', async () => {
    const { processWelcomeEmailJob } = await import('../src/infrastructure/jobs/workers/welcomeEmailWorker.js');
    const job = { id: 'job-1', data: { userId: 'user-1', email: 'cook@example.com' } } as Job<never>;

    await processWelcomeEmailJob(job as never);

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1', isDeleted: false },
      select: { displayName: true },
    });
    expect(sendWelcomeEmail).toHaveBeenCalledWith('cook@example.com', 'Integration cook');
  });

  it('fails the job when the user no longer exists so BullMQ can retry it', async () => {
    findUnique.mockResolvedValue(null);
    const { processWelcomeEmailJob } = await import('../src/infrastructure/jobs/workers/welcomeEmailWorker.js');
    const job = { id: 'job-2', data: { userId: 'missing', email: 'cook@example.com' } } as Job<never>;

    await expect(processWelcomeEmailJob(job as never)).rejects.toThrow('user missing was not found');
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
