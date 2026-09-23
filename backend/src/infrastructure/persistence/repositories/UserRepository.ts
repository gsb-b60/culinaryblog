import { PrismaClient, User as PrismaUser } from '@prisma/client';

import { User, UserProps } from '../../../domain/entities/User.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { EmailAddress } from '../../../domain/value-objects/EmailAddress.js';
import { UserRole } from '../../../domain/enums/UserRole.js';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(prismaUser: PrismaUser): User {
    const props: UserProps = {
      id: prismaUser.id,
      email: EmailAddress.fromExisting(prismaUser.email),
      passwordHash: prismaUser.passwordHash ?? undefined,
      displayName: prismaUser.displayName,
      avatarUrl: prismaUser.avatarUrl ?? undefined,
      bio: prismaUser.bio ?? undefined,
      googleId: prismaUser.googleId ?? undefined,
      role: prismaUser.role as UserRole,
      emailVerified: prismaUser.emailVerified,
      isActive: prismaUser.isActive,
      twoFactorEnabled: prismaUser.twoFactorEnabled,
      lockoutEnabled: prismaUser.lockoutEnabled,
      accessFailedCount: prismaUser.accessFailedCount,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      isDeleted: prismaUser.isDeleted,
      version: prismaUser.version,
    };
    return User.reconstruct(props);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.getValue(), isDeleted: false },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { googleId, isDeleted: false },
    });
    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    const props = user.toPersistence();
    
    const data: any = {
      id: props.id,
      email: props.email.getValue(),
      passwordHash: props.passwordHash,
      displayName: props.displayName,
      avatarUrl: props.avatarUrl,
      bio: props.bio,
      googleId: props.googleId,
      role: props.role,
      emailVerified: props.emailVerified,
      isActive: props.isActive,
      twoFactorEnabled: props.twoFactorEnabled,
      lockoutEnabled: props.lockoutEnabled,
      accessFailedCount: props.accessFailedCount,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      isDeleted: props.isDeleted,
      version: props.version,
    };

    const saved = await this.prisma.user.upsert({
      where: { id: props.id },
      create: data,
      update: data,
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async existsByEmail(email: EmailAddress): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.getValue(), isDeleted: false },
    });
    return count > 0;
  }

  async existsByGoogleId(googleId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { googleId, isDeleted: false },
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.user.count({ where: { isDeleted: false } });
  }
}