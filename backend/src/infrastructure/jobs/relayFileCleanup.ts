import { PrismaClient } from '@prisma/client';

import { FileCleanupJobData } from './queues/fileCleanupQueue.js';

export async function relayFileCleanup(
  prisma: PrismaClient,
  enqueue: (id: string, data: FileCleanupJobData) => Promise<unknown>,
): Promise<void> {
  const tasks = await prisma.fileCleanupTask.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 100,
  });
  for (const task of tasks) {
    // Stable ID makes a repeat delivery safe if the process stops after queue.add.
    await enqueue(task.id, { recipeId: task.recipeId, url: task.url });
    await prisma.fileCleanupTask.deleteMany({ where: { id: task.id } });
  }
}
