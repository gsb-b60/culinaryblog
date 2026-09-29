import { PrismaClient } from '@prisma/client';

import { NotFoundError } from '../../config-middleware/shared/errors/AppError.js';
import { IQueryHandler } from '../command-bus.js';
import { UserDto } from '../dtos/UserDto.js';
import { GetCurrentUserQuery } from '../queries/auth/AuthQueries.js';

export class GetCurrentUserQueryHandler implements IQueryHandler<GetCurrentUserQuery, UserDto> {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(query: GetCurrentUserQuery): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({ where: { id: query.userId, isDeleted: false } });
    if (!user) throw new NotFoundError('User');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? undefined,
      bio: user.bio ?? undefined,
      role: user.role as import('../../domain/enums/UserRole.js').UserRole,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
