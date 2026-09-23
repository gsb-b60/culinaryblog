import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Middleware for audit fields and soft delete
prisma.$use(async (params, next) => {
  // Handle soft delete - add isDeleted: false to all queries
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.args = params.args || {};
    params.args.where = params.args.where || {};
    if (!('isDeleted' in params.args.where)) {
      params.args.where.isDeleted = false;
    }
  }

  if (params.action === 'findMany') {
    params.args = params.args || {};
    params.args.where = params.args.where || {};
    if (!('isDeleted' in params.args.where)) {
      params.args.where.isDeleted = false;
    }
  }

  // Handle update - increment version
  if (params.action === 'update' || params.action === 'updateMany') {
    params.args = params.args || {};
    params.args.data = params.args.data || {};
    if (!('version' in params.args.data)) {
      params.args.data.version = { increment: 1 };
    }
    params.args.data.updatedAt = new Date();
  }

  // Handle create - set createdAt and version
  if (params.action === 'create' || params.action === 'createMany') {
    params.args = params.args || {};
    params.args.data = params.args.data || {};
    if (Array.isArray(params.args.data)) {
      params.args.data = params.args.data.map((d: any) => ({
        ...d,
        createdAt: d.createdAt || new Date(),
        updatedAt: d.updatedAt || new Date(),
        version: d.version || 1,
        isDeleted: d.isDeleted ?? false,
      }));
    } else {
      params.args.data.createdAt = params.args.data.createdAt || new Date();
      params.args.data.updatedAt = params.args.data.updatedAt || new Date();
      params.args.data.version = params.args.data.version || 1;
      params.args.data.isDeleted = params.args.data.isDeleted ?? false;
    }
  }

  return next(params);
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function runInTransaction<T>(
  fn: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}