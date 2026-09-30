import { PrismaClient } from '@prisma/client';
import { IUnitOfWork } from '../../domain/repositories/IUnitOfWork.js';
import { PrismaTransactionClient } from '../../config-middleware/shared/database/client.js';

export class PrismaUnitOfWork implements IUnitOfWork<PrismaTransactionClient> {
  constructor(private readonly prisma: PrismaClient) {}

  execute<T>(work: (transaction: PrismaTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }
}