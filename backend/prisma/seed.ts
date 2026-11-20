import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { seedCategories } from '../src/infrastructure/persistence/seed/categorySeeder.js';
import { seedRecipes } from '../src/infrastructure/persistence/seed/recipeSeeder.js';
import { seedUsers } from '../src/infrastructure/persistence/seed/userSeeder.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting curated recipe database seed...');

  try {
    const userIds = await seedUsers(prisma);
    const categoryIds = await seedCategories(prisma);
    await seedRecipes(prisma, userIds.slice(1), categoryIds);

    // The API caches public recipe details in Redis. Clear those entries so a
    // running development server cannot continue serving the pre-seed three-step
    // versions after the database has been refreshed.
    if (process.env.REDIS_URL) {
      const { Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      try {
        const keys = await redis.keys('recipes:*');
        if (keys.length > 0) await redis.del(...keys);
      } finally {
        await redis.quit();
      }
    }

    console.log('✅ Curated recipe database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  process.exit(1);
});
