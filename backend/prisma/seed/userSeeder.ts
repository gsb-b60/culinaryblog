import { PrismaClient, Role } from '@prisma/client';
import { PasswordService } from '../../../auth/PasswordService.js';
import { User } from '../../../../domain/entities/User.js';

export async function seedUsers(prisma: PrismaClient): Promise<string[]> {
  const userIds: string[] = [];

  // Create admin user
  const adminPasswordHash = await PasswordService.hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lethimcook.com' },
    create: {
      email: 'admin@lethimcook.com',
      passwordHash: adminPasswordHash,
      displayName: 'Admin',
      role: Role.ADMIN,
      emailVerified: true,
      isActive: true,
    },
    update: {
      passwordHash: adminPasswordHash,
      displayName: 'Admin',
      role: Role.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });
  userIds.push(admin.id);

  // Create author users
  const authors = [
    { email: 'chef.nguyen@lethimcook.com', displayName: 'Chef Nguyễn', bio: 'Đầu bếp chuyên nghiệp với 15 năm kinh nghiệm ẩm thực Việt Nam' },
    { email: 'chef.tran@lethimcook.com', displayName: 'Chef Trần', bio: 'Chuyên gia món ăn truyền thống và fusion' },
    { email: 'chef.le@lethimcook.com', displayName: 'Chef Lê', bio: 'Tình yêu nấu ăn từ nhỏ, chia sẻ công thức gia truyền' },
    { email: 'chef.pham@lethimcook.com', displayName: 'Chef Phạm', bio: 'Đầu bếp trẻ, sáng tạo các món ăn hiện đại' },
    { email: 'chef.vo@lethimcook.com', displayName: 'Chef Võ', bio: 'Chuyên về ẩm thực miền Nam và hải sản' },
  ];

  for (const authorData of authors) {
    const passwordHash = await PasswordService.hash('Author@123');
    const author = await prisma.user.upsert({
      where: { email: authorData.email },
      create: {
        email: authorData.email,
        passwordHash,
        displayName: authorData.displayName,
        bio: authorData.bio,
        role: Role.AUTHOR,
        emailVerified: true,
        isActive: true,
      },
      update: {
        passwordHash,
        displayName: authorData.displayName,
        bio: authorData.bio,
        role: Role.AUTHOR,
        emailVerified: true,
        isActive: true,
      },
    });
    userIds.push(author.id);
  }

  console.log(`✓ Created ${userIds.length} users (1 admin, ${userIds.length - 1} authors)`);
  return userIds;
}