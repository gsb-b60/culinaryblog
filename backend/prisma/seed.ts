import { PrismaClient, Role, RecipeDifficulty, RecipeStatus } from '@prisma/client';
import { PasswordService } from '../src/infrastructure/auth/PasswordService.js';
import { Slug } from '../src/domain/value-objects/Slug.js';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Vietnamese recipe data
const vietnameseCategories = [
  { name: 'Món chính', description: 'Các món ăn chính trong bữa cơm hàng ngày', orderIndex: 1 },
  { name: 'Món khai vị', description: 'Các món ăn nhẹ mở đầu bữa ăn', orderIndex: 2 },
  { name: 'Món tráng miệng', description: 'Các món ăn ngon ngọt sau bữa ăn', orderIndex: 3 },
  { name: 'Món canh', description: 'Các món canh, cháo, súp', orderIndex: 4 },
  { name: 'Món xào', description: 'Các món xào nhanh, thơm ngon', orderIndex: 5 },
  { name: 'Món nướng', description: 'Các món nướng thơm lừng', orderIndex: 6 },
  { name: 'Món hấp', description: 'Các món hấp giữ nguyên dinh dưỡng', orderIndex: 7 },
  { name: 'Món chiên', description: 'Các món chiên giòn rụm', orderIndex: 8 },
  { name: 'Món cuốn', description: 'Các món cuốn, gỏi cuốn tươi mát', orderIndex: 9 },
  { name: 'Món bún/phở', description: 'Các món bún, phở, mì truyền thống', orderIndex: 10 },
  { name: 'Món cơm', description: 'Các món cơm chiên, cơm niêu, cơm gà', orderIndex: 11 },
  { name: 'Món chay', description: 'Các món ăn chay thanh đạm', orderIndex: 12 },
  { name: 'Món hải sản', description: 'Các món từ hải sản tươi sống', orderIndex: 13 },
  { name: 'Món bò', description: 'Các món từ thịt bò', orderIndex: 14 },
  { name: 'Món gà', description: 'Các món từ thịt gà', orderIndex: 15 },
  { name: 'Món heo', description: 'Các món từ thịt heo', orderIndex: 16 },
  { name: 'Món trứng', description: 'Các món từ trứng gà, trứng cút', orderIndex: 17 },
  { name: 'Món đậu', description: 'Các món từ đậu, đậu phụ, đậu hũ', orderIndex: 18 },
  { name: 'Món rau củ', description: 'Các món từ rau củ quả tươi', orderIndex: 19 },
  { name: 'Món đặc sản', description: 'Các món đặc sản các vùng miền', orderIndex: 20 },
];

const vietnameseIngredients = [
  'Thịt bò', 'Thịt heo', 'Thịt gà', 'Tôm', 'Cá', 'Mực', 'Trứng gà', 'Trứng cút',
  'Đậu phụ', 'Đậu hũ', 'Rau muống', 'Cải ngọt', 'Bí đỏ', 'Cà chua', 'Dưa leo', 'Cà rốt',
  'Khoai tây', 'Khoai lang', 'Bắp cải', 'Bông cải xanh', 'Hành tây', 'Tỏi', 'Gừng', 'Sả',
  'Ngò rí', 'Hành lá', 'Rau ngò', 'Rau mùi', 'Rau húng quế', 'Rau thơm', 'Ớt', 'Tiêu',
  'Nước mắm', 'Nước tương', 'Dầu ăn', 'Dầu mè', 'Đường', 'Muối', 'Bột ngọt', 'Gạo',
  'Bún', 'Phở', 'Mì', 'Bánh mì', 'Bánh tráng', 'Bánh phở', 'Hủ tiếu', 'Miến',
  'Nấm', 'Nấm hương', 'Nấm rơm', 'Nấm kim châm', 'Đậu phộng', 'Vỏ đậu', 'Giá đỗ', 'Rau câu'
];

const vietnameseUnits = ['g', 'kg', 'ml', 'l', 'cái', 'quả', 'nhánh', 'muỗng', 'chén', 'bát', 'đĩa', 'hộp', 'gói', 'lít'];

const vietnameseRecipeNames = [
  'Phở bò tái', 'Phở gà', 'Bún bò Huế', 'Bún chả Hà Nội', 'Cơm tấm sườn nướng',
  'Bánh xèo miền Tây', 'Gỏi cuốn tôm thịt', 'Nem rán', 'Chả giò', 'Bún riêu cua',
  'Hủ tiếu Nam Vang', 'Mì Quảng', 'Bún mắm', 'Bún đậu mắm tôm', 'Cơm gà Hải Nam',
  'Cơm chiên Dương Châu', 'Cháo lòng', 'Cháo gà', 'Súp cua', 'Canh chua cá lóc',
  'Canh bí đỏ nấu tôm', 'Rau muống xào tỏi', 'Cải ngọt xào nấm', 'Bí đỏ nhồi thịt',
  'Cà ri gà', 'Cà ri bò', 'Thịt bò xào củ cải', 'Thịt heo xào cải làn', 'Gà nướng mật ong',
  'Sườn nướng sả', 'Bò lúc lắc', 'Tôm hấp bia', 'Cá hấp xì dầu', 'Mực xào sa tế',
  'Đậu hũ sốt cà chua', 'Đậu phụ chiên giòn', 'Canh đậu hũ rau cải', 'Bún thang', 'Bún ốc',
  'Bún nem', 'Bún thịt nướng', 'Cơm niêu', 'Cơm hến', 'Bánh canh cua',
  'Bánh canh giò heo', 'Miến gà', 'Miến lươn', 'Cháo ốc', 'Cháo đậu xanh',
  'Súp bò viên', 'Súp gà nấm', 'Canh khổ qua nhồi thịt', 'Canh măng nấu tôm', 'Rau đay nấu tôm',
  'Mướp hương nấu tôm', 'Bí ngô hấp', 'Khoai lang chiên', 'Khoai tây chiên', 'Bắp nướng bơ',
  'Khoai môn chiên', 'Nem chua', 'Nem nướng', 'Nem cuốn', 'Bò bía',
  'Gỏi ngó sen', 'Gỏi đu đủ', 'Gỏi gà', 'Gỏi bò', 'Nộm hoa chuối',
  'Chè đậu xanh', 'Chè bà ba', 'Chè trôi nước', 'Chè bắp', 'Chè sương sáo',
  'Bánh flan', 'Bánh bò', 'Bánh da lợn', 'Bánh chuối', 'Bánh khoai môn'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function seedUsers() {
  const userIds: string[] = [];

  const adminPasswordHash = await PasswordService.hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lethimcook.com' },
    create: { email: 'admin@lethimcook.com', passwordHash: adminPasswordHash, displayName: 'Admin', role: Role.ADMIN, emailVerified: true, isActive: true },
    update: { passwordHash: adminPasswordHash, displayName: 'Admin', role: Role.ADMIN, emailVerified: true, isActive: true },
  });
  userIds.push(admin.id);

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
      create: { email: authorData.email, passwordHash, displayName: authorData.displayName, bio: authorData.bio, role: Role.AUTHOR, emailVerified: true, isActive: true },
      update: { passwordHash, displayName: authorData.displayName, bio: authorData.bio, role: Role.AUTHOR, emailVerified: true, isActive: true },
    });
    userIds.push(author.id);
  }

  console.log(`✓ Created ${userIds.length} users (1 admin, ${userIds.length - 1} authors)`);
  return userIds;
}

async function seedCategories() {
  const categoryIds: string[] = [];

  for (let i = 0; i < vietnameseCategories.length; i++) {
    const catData = vietnameseCategories[i];
    const slug = generateSlug(catData.name);
    
    const category = await prisma.category.upsert({
      where: { slug },
      create: { name: catData.name, slug, description: catData.description, orderIndex: catData.orderIndex },
      update: { name: catData.name, description: catData.description, orderIndex: catData.orderIndex },
    });
    categoryIds.push(category.id);
  }

  console.log(`✓ Created ${categoryIds.length} categories`);
  return categoryIds;
}

async function seedRecipes(authorIds: string[], categoryIds: string[]) {
  let totalRecipes = 0;
  const targetRecipes = 100;
  const recipesPerAuthor = Math.ceil(targetRecipes / authorIds.length);
  
  for (const authorId of authorIds) {
    const recipesForThisAuthor = Math.min(recipesPerAuthor, targetRecipes - totalRecipes);
    
    for (let i = 0; i < recipesForThisAuthor; i++) {
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const name = getRandomElement(vietnameseRecipeNames);
      const difficulty = faker.helpers.arrayElement(Object.values(RecipeDifficulty));
      const prepTime = faker.number.int({ min: 10, max: 60 });
      const cookTime = faker.number.int({ min: 5, max: 120 });
      const servings = faker.number.int({ min: 2, max: 8 });
      
      const ingredientCount = faker.number.int({ min: 10, max: 15 });
      const stepCount = faker.number.int({ min: 5, max: 8 });
      
      const ingredients = getRandomElements(vietnameseIngredients, ingredientCount).map((name, index) => ({
        name,
        quantity: faker.number.float({ min: 10, max: 1000, fractionDigits: 1 }),
        unit: getRandomElement(vietnameseUnits),
        notes: faker.helpers.maybe(() => faker.lorem.words(3), { probability: 0.3 }),
        orderIndex: index,
      }));

      const steps = Array.from({ length: stepCount }, (_, index) => ({
        stepNumber: index + 1,
        title: faker.lorem.words(3),
        description: faker.lorem.sentences(2),
        timerMinutes: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 30 }), { probability: 0.5 }),
        imageUrl: faker.helpers.maybe(() => `https://picsum.photos/seed/${faker.string.uuid()}/800/600`, { probability: 0.3 }),
      }));

      const slug = Slug.create(name).getValue();
      let finalSlug = slug;
      let counter = 1;
      while (await prisma.recipe.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      await prisma.recipe.create({
        data: {
          title: name,
          slug: finalSlug,
          description: faker.lorem.sentences(3),
          instructions: faker.lorem.paragraph(),
          prepTime,
          cookTime,
          servings,
          difficulty,
          status: RecipeStatus.PUBLISHED,
          categoryId,
          authorId,
          nutritionCalories: faker.number.float({ min: 200, max: 800, fractionDigits: 1 }),
          nutritionProtein: faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
          nutritionCarbohydrates: faker.number.float({ min: 20, max: 100, fractionDigits: 1 }),
          nutritionFat: faker.number.float({ min: 5, max: 40, fractionDigits: 1 }),
          nutritionFiber: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
          nutritionSodium: faker.number.float({ min: 100, max: 1000, fractionDigits: 1 }),
          publishedAt: new Date(),
          ingredients: { create: ingredients },
          steps: { create: steps },
        },
      });
      
      totalRecipes++;
      if (totalRecipes >= targetRecipes) break;
    }
    if (totalRecipes >= targetRecipes) break;
  }

  console.log(`✓ Created ${totalRecipes} recipes with ingredients and steps`);
}

async function main() {
  console.log('🌱 Starting database seed...');
  
  try {
    const authorIds = await seedUsers();
    const categoryIds = await seedCategories();
    await seedRecipes(authorIds.slice(1), categoryIds);
    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });