import { PrismaClient } from '@prisma/client';
import { vietnameseCategories, generateSlug } from './faker-data.js';

export async function seedCategories(prisma: PrismaClient): Promise<string[]> {
  const categoryIds: string[] = [];

  for (let i = 0; i < vietnameseCategories.length; i++) {
    const catData = vietnameseCategories[i];
    const slug = generateSlug(catData.name);
    
    const category = await prisma.category.upsert({
      where: { slug },
      create: {
        name: catData.name,
        slug,
        description: catData.description,
        orderIndex: catData.orderIndex,
      },
      update: {
        name: catData.name,
        description: catData.description,
        orderIndex: catData.orderIndex,
      },
    });
    categoryIds.push(category.id);
  }

  console.log(`✓ Created ${categoryIds.length} categories`);
  return categoryIds;
}