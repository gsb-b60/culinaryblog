import { RecipeDifficulty } from '@prisma/client';

export interface SeedIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface SeedStep {
  title: string;
  description: string;
  timerMinutes?: number;
}

export interface RealRecipeSeed {
  slug: string;
  title: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  categorySlug: string;
  authorEmail: string;
  publishedAt: string;
  ingredients: SeedIngredient[];
  steps: SeedStep[];
}

/**
 * Curated Vietnamese recipes used by the development/demo database.
 *
 * This is intentionally a hand-written dataset. It must not contain generated
 * quantities, lorem ipsum text, or random combinations of ingredients and steps.
 */
export const REAL_RECIPE_DATA: RealRecipeSeed[] = [
  {
    slug: 'pho-bo-tai',
    title: 'Phở bò tái',
    description:
      'Nước dùng trong, thơm mùi quế hồi, ăn cùng bánh phở mềm và những lát bò tái chín vừa tới.',
    instructions:
      'Nướng hành tây và gừng cho xém cạnh để nước dùng có mùi thơm. Chần xương bò, rửa sạch rồi hầm với 3 lít nước trong khoảng 3 giờ. Nêm nước dùng bằng muối, đường phèn và nước mắm. Khi ăn, trụng bánh phở, xếp thịt bò thái mỏng lên trên rồi chan nước dùng đang sôi.',
    prepTime: 30,
    cookTime: 210,
    servings: 4,
    difficulty: RecipeDifficulty.HARD,
    categorySlug: 'mon-bun-pho',
    authorEmail: 'chef.nguyen@lethimcook.com',
    publishedAt: '2026-01-10T08:00:00.000Z',
    ingredients: [
      { name: 'Xương ống bò', quantity: 1000, unit: 'g', notes: 'Chần qua nước sôi và rửa sạch' },
      { name: 'Thịt bò thăn', quantity: 400, unit: 'g', notes: 'Thái lát thật mỏng' },
      { name: 'Bánh phở tươi', quantity: 800, unit: 'g' },
      { name: 'Hành tây', quantity: 1, unit: 'củ', notes: 'Nướng thơm' },
      { name: 'Gừng tươi', quantity: 1, unit: 'củ nhỏ', notes: 'Nướng thơm, đập dập' },
      { name: 'Quế', quantity: 1, unit: 'thanh' },
      { name: 'Hoa hồi', quantity: 4, unit: 'cánh' },
      { name: 'Đường phèn', quantity: 25, unit: 'g' },
      { name: 'Nước mắm', quantity: 30, unit: 'ml' },
      { name: 'Rau thơm, chanh, ớt', quantity: 1, unit: 'đĩa', notes: 'Ăn kèm' },
    ],
    steps: [
      {
        title: 'Sơ chế xương',
        description:
          'Chần xương bò trong nước sôi 5 phút, đổ bỏ nước chần và rửa xương dưới vòi nước để nước dùng trong.',
        timerMinutes: 10,
      },
      {
        title: 'Nướng gia vị',
        description:
          'Nướng hành tây và gừng trên bếp đến khi cháy xém nhẹ. Rang quế và hoa hồi trong chảo khô cho dậy mùi.',
        timerMinutes: 8,
      },
      {
        title: 'Hầm nước dùng',
        description:
          'Cho xương vào nồi với 3 lít nước, hành, gừng, quế và hoa hồi. Hầm lửa nhỏ, thường xuyên hớt bọt.',
        timerMinutes: 180,
      },
      {
        title: 'Nêm nước phở',
        description:
          'Lọc nước dùng, nêm đường phèn, muối và nước mắm sao cho vị thanh, đậm vừa phải.',
        timerMinutes: 10,
      },
      {
        title: 'Hoàn thành',
        description:
          'Trụng bánh phở, cho vào bát cùng thịt bò thái mỏng, chan nước dùng thật nóng và dùng ngay với rau thơm, chanh, ớt.',
      },
    ],
  },
  {
    slug: 'bun-cha-ha-noi',
    title: 'Bún chả Hà Nội',
    description:
      'Bún tươi dùng với chả viên, chả miếng nướng thơm và bát nước chấm chua ngọt có dưa góp.',
    instructions:
      'Ướp thịt xay và thịt ba chỉ riêng với hành, tỏi, nước mắm, đường và tiêu. Vo thịt xay thành viên, thái ba chỉ thành miếng mỏng rồi nướng đến khi vàng cạnh. Pha nước chấm chua ngọt, thêm dưa góp cà rốt đu đủ xanh và dọn cùng bún, rau sống.',
    prepTime: 35,
    cookTime: 30,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-chinh',
    authorEmail: 'chef.tran@lethimcook.com',
    publishedAt: '2026-01-12T08:00:00.000Z',
    ingredients: [
      { name: 'Thịt nạc vai xay', quantity: 400, unit: 'g' },
      { name: 'Thịt ba chỉ', quantity: 300, unit: 'g', notes: 'Thái miếng mỏng' },
      { name: 'Bún tươi', quantity: 800, unit: 'g' },
      { name: 'Hành tím', quantity: 3, unit: 'củ', notes: 'Băm nhỏ' },
      { name: 'Tỏi', quantity: 3, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Nước mắm', quantity: 60, unit: 'ml' },
      { name: 'Đường', quantity: 35, unit: 'g' },
      { name: 'Giấm gạo', quantity: 30, unit: 'ml' },
      { name: 'Đu đủ xanh và cà rốt', quantity: 250, unit: 'g', notes: 'Làm dưa góp' },
      { name: 'Rau sống', quantity: 300, unit: 'g' },
    ],
    steps: [
      {
        title: 'Ướp thịt',
        description:
          'Trộn thịt xay với một nửa hành tím, tỏi, 20 ml nước mắm, 15 g đường và tiêu. Ướp thịt ba chỉ với phần gia vị còn lại.',
        timerMinutes: 20,
      },
      {
        title: 'Chuẩn bị dưa góp',
        description:
          'Thái mỏng đu đủ xanh và cà rốt, bóp nhẹ với muối rồi rửa sạch. Trộn với một ít giấm và đường.',
        timerMinutes: 10,
      },
      {
        title: 'Tạo hình chả',
        description:
          'Vo thịt xay thành viên dẹt. Trải thịt ba chỉ lên vỉ nướng, phết một lớp dầu mỏng để thịt không bị khô.',
      },
      {
        title: 'Nướng chả',
        description:
          'Nướng chả viên và chả miếng trên than hoặc trong lò 200°C, trở đều đến khi chín vàng và có cạnh xém thơm.',
        timerMinutes: 20,
      },
      {
        title: 'Pha nước chấm',
        description:
          'Đun nhẹ 200 ml nước với đường, để nguội rồi pha cùng nước mắm và giấm. Thêm tỏi, ớt và dưa góp khi dùng.',
      },
    ],
  },
  {
    slug: 'goi-cuon-tom-thit',
    title: 'Gỏi cuốn tôm thịt',
    description:
      'Gỏi cuốn tươi mát với tôm, thịt ba chỉ, bún và rau thơm, chấm cùng tương đậu phộng béo nhẹ.',
    instructions:
      'Luộc tôm và thịt ba chỉ vừa chín, để nguội rồi thái lát. Nhúng bánh tráng nhanh qua nước lọc, xếp rau, bún, thịt và tôm vào giữa. Gấp hai mép bánh tráng, cuộn chặt tay và dùng với nước chấm tương đậu phộng.',
    prepTime: 25,
    cookTime: 15,
    servings: 4,
    difficulty: RecipeDifficulty.EASY,
    categorySlug: 'mon-cuon',
    authorEmail: 'chef.le@lethimcook.com',
    publishedAt: '2026-01-15T08:00:00.000Z',
    ingredients: [
      { name: 'Tôm sú', quantity: 300, unit: 'g', notes: 'Bóc vỏ, bỏ chỉ lưng sau khi luộc' },
      { name: 'Thịt ba chỉ', quantity: 250, unit: 'g' },
      { name: 'Bánh tráng', quantity: 16, unit: 'tấm' },
      { name: 'Bún tươi', quantity: 300, unit: 'g' },
      { name: 'Xà lách và rau thơm', quantity: 250, unit: 'g' },
      { name: 'Tương đen', quantity: 80, unit: 'g' },
      { name: 'Bơ đậu phộng', quantity: 40, unit: 'g' },
      { name: 'Đậu phộng rang', quantity: 20, unit: 'g', notes: 'Giã dập' },
    ],
    steps: [
      {
        title: 'Luộc nguyên liệu',
        description:
          'Luộc tôm trong nước sôi đến khi chuyển màu đỏ cam. Luộc thịt ba chỉ chín tới, để nguội rồi thái lát mỏng.',
        timerMinutes: 12,
      },
      {
        title: 'Chuẩn bị rau và bún',
        description:
          'Rửa sạch rau, để thật ráo nước. Chần bún qua nước nóng nếu bún bị dính rồi để nguội.',
      },
      {
        title: 'Pha nước chấm',
        description:
          'Khuấy tương đen với bơ đậu phộng và một ít nước ấm đến khi mịn. Rắc đậu phộng rang lên trên.',
      },
      {
        title: 'Cuốn gỏi',
        description:
          'Nhúng từng tấm bánh tráng qua nước, đặt rau, bún, thịt và tôm lên một phía. Gấp mép rồi cuộn chặt tay.',
      },
    ],
  },
  {
    slug: 'com-tam-suon-nuong',
    title: 'Cơm tấm sườn nướng',
    description: 'Sườn cốt lết nướng mềm thơm, ăn cùng cơm tấm, mỡ hành và nước mắm chua ngọt.',
    instructions:
      'Ướp sườn với nước mắm, mật ong, dầu hào, hành tỏi và tiêu ít nhất 1 giờ. Nướng sườn ở nhiệt độ vừa, trở mặt và phết nước ướp cho đến khi chín mềm. Dọn sườn với cơm tấm, đồ chua, mỡ hành và nước mắm.',
    prepTime: 75,
    cookTime: 35,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-com',
    authorEmail: 'chef.pham@lethimcook.com',
    publishedAt: '2026-01-18T08:00:00.000Z',
    ingredients: [
      { name: 'Sườn cốt lết', quantity: 800, unit: 'g', notes: 'Dần nhẹ cho mềm' },
      { name: 'Gạo tấm', quantity: 400, unit: 'g' },
      { name: 'Nước mắm', quantity: 45, unit: 'ml' },
      { name: 'Dầu hào', quantity: 30, unit: 'ml' },
      { name: 'Mật ong', quantity: 20, unit: 'ml' },
      { name: 'Hành tím', quantity: 3, unit: 'củ', notes: 'Băm nhỏ' },
      { name: 'Tỏi', quantity: 3, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Hành lá', quantity: 50, unit: 'g', notes: 'Làm mỡ hành' },
      { name: 'Dưa leo và đồ chua', quantity: 300, unit: 'g' },
    ],
    steps: [
      {
        title: 'Ướp sườn',
        description:
          'Trộn nước mắm, dầu hào, mật ong, hành tím, tỏi và tiêu. Ướp sườn trong hộp kín ít nhất 1 giờ trong ngăn mát.',
        timerMinutes: 60,
      },
      {
        title: 'Nấu cơm tấm',
        description:
          'Vo gạo tấm, ngâm 20 phút rồi nấu với lượng nước phù hợp để hạt cơm chín mềm nhưng không nhão.',
        timerMinutes: 30,
      },
      {
        title: 'Nướng sườn',
        description:
          'Nướng sườn ở 200°C, trở mặt sau 12 phút và phết thêm nước ướp. Nướng đến khi sườn chín và vàng đều.',
        timerMinutes: 25,
      },
      {
        title: 'Làm mỡ hành',
        description:
          'Đun nóng dầu ăn rồi rưới lên hành lá thái nhỏ, khuấy đều và nêm một nhúm muối.',
      },
      {
        title: 'Dọn món',
        description:
          'Xới cơm tấm ra đĩa, đặt sườn nướng lên trên, thêm mỡ hành, dưa leo, đồ chua và nước mắm.',
      },
    ],
  },
  {
    slug: 'banh-xeo-mien-tay',
    title: 'Bánh xèo miền Tây',
    description:
      'Bánh xèo vàng giòn, nhân tôm thịt và giá đỗ, cuốn rau sống rồi chấm nước mắm chua ngọt.',
    instructions:
      'Pha bột bánh xèo với nước, nước cốt dừa và bột nghệ rồi để bột nghỉ. Xào nhanh tôm và thịt. Làm nóng chảo, tráng bột thật mỏng, cho nhân và giá vào rồi đậy nắp đến khi bánh giòn. Gập đôi bánh và ăn cùng rau sống.',
    prepTime: 30,
    cookTime: 30,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-chien',
    authorEmail: 'chef.vo@lethimcook.com',
    publishedAt: '2026-01-21T08:00:00.000Z',
    ingredients: [
      { name: 'Bột bánh xèo', quantity: 250, unit: 'g' },
      { name: 'Nước cốt dừa', quantity: 200, unit: 'ml' },
      { name: 'Tôm tươi', quantity: 250, unit: 'g', notes: 'Bóc vỏ' },
      { name: 'Thịt ba chỉ', quantity: 200, unit: 'g', notes: 'Thái mỏng' },
      { name: 'Giá đỗ', quantity: 250, unit: 'g' },
      { name: 'Hành lá', quantity: 50, unit: 'g' },
      { name: 'Bột nghệ', quantity: 1, unit: 'thìa cà phê' },
      { name: 'Rau sống', quantity: 400, unit: 'g' },
      { name: 'Nước mắm', quantity: 60, unit: 'ml', notes: 'Pha nước chấm' },
    ],
    steps: [
      {
        title: 'Pha bột',
        description:
          'Khuấy bột bánh xèo với nước cốt dừa, 250 ml nước lọc và bột nghệ. Thêm hành lá rồi để bột nghỉ 20 phút.',
        timerMinutes: 20,
      },
      {
        title: 'Sơ chế nhân',
        description: 'Rửa sạch tôm, thái thịt ba chỉ mỏng. Nhặt và rửa giá đỗ, để ráo.',
      },
      {
        title: 'Xào nhân',
        description: 'Xào thịt đến khi săn, thêm tôm và đảo đến khi tôm vừa chín. Múc nhân ra đĩa.',
      },
      {
        title: 'Đổ bánh',
        description:
          'Làm nóng chảo, cho ít dầu rồi đổ một vá bột, xoay chảo cho bột thật mỏng. Cho nhân và giá vào, đậy nắp đến khi bánh giòn.',
        timerMinutes: 4,
      },
      {
        title: 'Thưởng thức',
        description: 'Gập đôi bánh, cắt miếng và cuốn với rau sống. Chấm nước mắm pha chua ngọt.',
      },
    ],
  },
  {
    slug: 'canh-chua-ca-loc',
    title: 'Canh chua cá lóc',
    description:
      'Canh chua cá lóc thanh dịu với me, dứa, cà chua và đậu bắp, phù hợp cho bữa cơm gia đình.',
    instructions:
      'Làm sạch cá lóc, cắt khúc và ướp nhẹ với muối. Nấu nước me, cho cá vào nấu vừa chín rồi thêm dứa, cà chua, đậu bắp và bạc hà. Nêm nước mắm, đường, muối theo vị chua ngọt cân bằng và rắc rau om trước khi tắt bếp.',
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    difficulty: RecipeDifficulty.EASY,
    categorySlug: 'mon-canh',
    authorEmail: 'chef.vo@lethimcook.com',
    publishedAt: '2026-01-24T08:00:00.000Z',
    ingredients: [
      { name: 'Cá lóc', quantity: 700, unit: 'g', notes: 'Làm sạch, cắt khúc' },
      { name: 'Me chua', quantity: 50, unit: 'g' },
      { name: 'Dứa', quantity: 200, unit: 'g', notes: 'Cắt miếng' },
      { name: 'Cà chua', quantity: 2, unit: 'quả', notes: 'Bổ múi cau' },
      { name: 'Đậu bắp', quantity: 150, unit: 'g' },
      { name: 'Bạc hà', quantity: 150, unit: 'g' },
      { name: 'Giá đỗ', quantity: 100, unit: 'g' },
      { name: 'Nước mắm', quantity: 25, unit: 'ml' },
      { name: 'Rau om và ngò gai', quantity: 30, unit: 'g' },
    ],
    steps: [
      {
        title: 'Sơ chế cá',
        description:
          'Chà cá với muối và chanh để khử mùi, rửa sạch rồi cắt thành khúc vừa ăn. Ướp cá với một ít muối.',
        timerMinutes: 10,
      },
      {
        title: 'Nấu nước me',
        description: 'Dầm me với 500 ml nước ấm, lọc lấy nước cốt rồi đun sôi trong nồi.',
      },
      {
        title: 'Nấu cá',
        description:
          'Cho cá vào nồi nước me, nấu đến khi cá vừa chín thì vớt bọt để nước canh trong.',
        timerMinutes: 10,
      },
      {
        title: 'Thêm rau củ',
        description:
          'Cho dứa, cà chua, đậu bắp và bạc hà vào. Nêm nước mắm, đường và muối theo vị chua ngọt.',
        timerMinutes: 8,
      },
      {
        title: 'Hoàn thành',
        description: 'Tắt bếp, cho giá đỗ, rau om và ngò gai vào. Dùng nóng với cơm trắng.',
      },
    ],
  },
  {
    slug: 'ca-kho-to',
    title: 'Cá kho tộ',
    description:
      'Cá kho trong nồi đất với nước màu, nước mắm và tiêu, thấm vị đậm đà để ăn cùng cơm nóng.',
    instructions:
      'Ướp cá với nước mắm, đường, hành tỏi và tiêu. Thắng đường thành nước màu, xếp cá vào nồi cùng nước dừa tươi rồi kho nhỏ lửa đến khi nước sánh lại. Trở cá nhẹ một lần trong khi kho để cá thấm đều mà không bị nát.',
    prepTime: 40,
    cookTime: 55,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-hai-san',
    authorEmail: 'chef.vo@lethimcook.com',
    publishedAt: '2026-01-27T08:00:00.000Z',
    ingredients: [
      { name: 'Cá basa hoặc cá lóc', quantity: 800, unit: 'g', notes: 'Cắt khúc dày' },
      { name: 'Nước mắm', quantity: 60, unit: 'ml' },
      { name: 'Nước dừa tươi', quantity: 300, unit: 'ml' },
      { name: 'Đường', quantity: 35, unit: 'g' },
      { name: 'Hành tím', quantity: 4, unit: 'củ', notes: 'Băm nhỏ' },
      { name: 'Tỏi', quantity: 4, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Tiêu đen', quantity: 5, unit: 'g', notes: 'Đập dập' },
      { name: 'Ớt', quantity: 2, unit: 'quả' },
      { name: 'Hành lá', quantity: 20, unit: 'g' },
    ],
    steps: [
      {
        title: 'Ướp cá',
        description:
          'Trộn cá với 40 ml nước mắm, một nửa hành tỏi, tiêu và 15 g đường. Để cá thấm trong 30 phút.',
        timerMinutes: 30,
      },
      {
        title: 'Làm nước màu',
        description:
          'Cho phần đường còn lại vào nồi đất, đun lửa nhỏ đến khi đường chuyển màu cánh gián. Thêm một ít nước nóng để tạo nước màu.',
      },
      {
        title: 'Kho cá',
        description:
          'Xếp cá vào nồi, thêm nước dừa, phần nước mắm và hành tỏi còn lại. Đun sôi rồi hạ lửa thật nhỏ.',
        timerMinutes: 45,
      },
      {
        title: 'Hoàn thành',
        description:
          'Kho đến khi nước sánh, nêm lại cho vừa. Thêm ớt và hành lá trước khi dùng với cơm nóng.',
      },
    ],
  },
  {
    slug: 'thit-kho-trung',
    title: 'Thịt kho trứng',
    description:
      'Thịt ba chỉ mềm, trứng thấm nước dừa và nước màu, là món mặn quen thuộc trong bữa cơm Việt.',
    instructions:
      'Luộc trứng, bóc vỏ và chiên sơ cho mặt ngoài săn lại. Ướp thịt ba chỉ với nước mắm, đường, hành tỏi. Làm nước màu, cho thịt và nước dừa vào kho mềm rồi thêm trứng ở nửa cuối thời gian để trứng thấm mà không bị cứng.',
    prepTime: 30,
    cookTime: 75,
    servings: 5,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-heo',
    authorEmail: 'chef.nguyen@lethimcook.com',
    publishedAt: '2026-01-30T08:00:00.000Z',
    ingredients: [
      { name: 'Thịt ba chỉ', quantity: 800, unit: 'g', notes: 'Cắt khối 4 cm' },
      { name: 'Trứng gà', quantity: 6, unit: 'quả' },
      { name: 'Nước dừa tươi', quantity: 500, unit: 'ml' },
      { name: 'Nước mắm', quantity: 60, unit: 'ml' },
      { name: 'Đường', quantity: 45, unit: 'g' },
      { name: 'Hành tím', quantity: 4, unit: 'củ', notes: 'Băm nhỏ' },
      { name: 'Tỏi', quantity: 4, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Tiêu', quantity: 3, unit: 'g' },
    ],
    steps: [
      {
        title: 'Luộc trứng',
        description:
          'Luộc trứng 9 phút, ngâm vào nước lạnh rồi bóc vỏ. Chiên sơ trứng với ít dầu cho vàng mặt.',
        timerMinutes: 12,
      },
      {
        title: 'Ướp thịt',
        description:
          'Trộn thịt với nước mắm, một nửa đường, hành, tỏi và tiêu. Để thịt thấm trong 20 phút.',
        timerMinutes: 20,
      },
      {
        title: 'Kho thịt',
        description:
          'Thắng phần đường còn lại thành nước màu. Cho thịt vào đảo săn, thêm nước dừa và đun sôi.',
        timerMinutes: 15,
      },
      {
        title: 'Thêm trứng',
        description:
          'Hạ lửa nhỏ, đậy nắp kho thịt khoảng 45 phút. Cho trứng vào ở 20 phút cuối và trở nhẹ để trứng thấm đều.',
        timerMinutes: 45,
      },
      {
        title: 'Nêm và dùng',
        description: 'Nêm lại với nước mắm nếu cần. Dùng thịt kho trứng với cơm trắng và rau luộc.',
      },
    ],
  },
  {
    slug: 'ga-nuong-mat-ong',
    title: 'Gà nướng mật ong',
    description:
      'Đùi gà nướng vàng óng, da thơm ngọt nhẹ từ mật ong và thịt bên trong vẫn mềm mọng.',
    instructions:
      'Khứa nhẹ đùi gà để gia vị thấm. Ướp gà với mật ong, nước mắm, dầu hào, tỏi, gừng và ngũ vị hương. Nướng gà ở nhiệt độ vừa, phết thêm sốt trong quá trình nướng và tăng nhiệt cuối cùng để da vàng giòn.',
    prepTime: 45,
    cookTime: 50,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    categorySlug: 'mon-ga',
    authorEmail: 'chef.pham@lethimcook.com',
    publishedAt: '2026-02-02T08:00:00.000Z',
    ingredients: [
      { name: 'Đùi gà', quantity: 1000, unit: 'g', notes: 'Khoảng 4 chiếc' },
      { name: 'Mật ong', quantity: 45, unit: 'ml' },
      { name: 'Nước mắm', quantity: 30, unit: 'ml' },
      { name: 'Dầu hào', quantity: 30, unit: 'ml' },
      { name: 'Tỏi', quantity: 4, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Gừng', quantity: 20, unit: 'g', notes: 'Băm nhỏ' },
      { name: 'Ngũ vị hương', quantity: 3, unit: 'g' },
      { name: 'Dầu ăn', quantity: 15, unit: 'ml' },
    ],
    steps: [
      {
        title: 'Sơ chế gà',
        description:
          'Rửa gà với muối loãng, thấm khô và khứa vài đường ở phần dày nhất để gà chín đều.',
      },
      {
        title: 'Ướp gà',
        description:
          'Trộn mật ong, nước mắm, dầu hào, tỏi, gừng, ngũ vị hương và dầu ăn. Phết đều lên gà, ướp trong ngăn mát.',
        timerMinutes: 30,
      },
      {
        title: 'Nướng lần đầu',
        description:
          'Làm nóng lò ở 190°C. Đặt gà lên vỉ, nướng 25 phút rồi lấy ra phết thêm phần sốt còn lại.',
        timerMinutes: 25,
      },
      {
        title: 'Nướng hoàn thiện',
        description:
          'Nướng tiếp đến khi nhiệt độ trong phần dày nhất đạt 74°C và da gà vàng đều. Nghỉ gà 5 phút trước khi chặt.',
        timerMinutes: 20,
      },
    ],
  },
  {
    slug: 'bo-luc-lac',
    title: 'Bò lúc lắc',
    description:
      'Thịt bò mềm áp chảo nhanh với hành tây và ớt chuông, giữ được vị ngọt tự nhiên và mùi thơm của tiêu.',
    instructions:
      'Cắt thịt bò thành khối vừa ăn, thấm khô rồi ướp với dầu hào, nước tương, tỏi và tiêu. Làm nóng chảo thật kỹ, áp chảo bò từng mẻ để thịt xém cạnh mà không ra nước. Xào nhanh hành tây, ớt chuông rồi trộn cùng thịt bò trước khi dọn.',
    prepTime: 25,
    cookTime: 15,
    servings: 3,
    difficulty: RecipeDifficulty.EASY,
    categorySlug: 'mon-bo',
    authorEmail: 'chef.tran@lethimcook.com',
    publishedAt: '2026-02-05T08:00:00.000Z',
    ingredients: [
      { name: 'Thịt thăn bò', quantity: 500, unit: 'g', notes: 'Cắt khối 2 cm' },
      { name: 'Hành tây', quantity: 1, unit: 'củ', notes: 'Cắt múi cau' },
      { name: 'Ớt chuông', quantity: 1, unit: 'quả', notes: 'Cắt miếng vuông' },
      { name: 'Tỏi', quantity: 4, unit: 'tép', notes: 'Băm nhỏ' },
      { name: 'Dầu hào', quantity: 20, unit: 'ml' },
      { name: 'Nước tương', quantity: 15, unit: 'ml' },
      { name: 'Dầu ăn', quantity: 30, unit: 'ml' },
      { name: 'Tiêu đen', quantity: 3, unit: 'g' },
    ],
    steps: [
      {
        title: 'Ướp bò',
        description:
          'Trộn bò với dầu hào, nước tương, một nửa tỏi, tiêu và 10 ml dầu ăn. Để thịt nghỉ 15 phút.',
        timerMinutes: 15,
      },
      {
        title: 'Áp chảo bò',
        description:
          'Làm nóng chảo đến khi bốc hơi nhẹ, cho bò vào áp chảo từng mẻ. Đảo nhanh để các mặt xém cạnh nhưng bên trong còn mềm.',
        timerMinutes: 5,
      },
      {
        title: 'Xào rau củ',
        description:
          'Cho phần dầu còn lại vào chảo, phi tỏi rồi xào hành tây và ớt chuông đến khi vừa chín tới.',
        timerMinutes: 5,
      },
      {
        title: 'Hoàn thành',
        description:
          'Cho bò trở lại chảo, đảo cùng rau củ khoảng 1 phút rồi tắt bếp. Rắc thêm tiêu và dùng nóng.',
      },
    ],
  },
  {
    slug: 'rau-muong-xao-toi',
    title: 'Rau muống xào tỏi',
    description:
      'Rau muống xanh giòn xào nhanh với nhiều tỏi, món rau đơn giản nhưng rất hợp với cơm nóng.',
    instructions:
      'Nhặt rau muống, rửa sạch và để ráo. Chần rau nhanh trong nước sôi có chút muối rồi làm nguội để giữ màu. Phi thơm tỏi, cho rau vào đảo trên lửa lớn, nêm dầu hào và nước mắm rồi tắt bếp ngay khi rau vừa thấm.',
    prepTime: 15,
    cookTime: 8,
    servings: 3,
    difficulty: RecipeDifficulty.EASY,
    categorySlug: 'mon-xao',
    authorEmail: 'chef.le@lethimcook.com',
    publishedAt: '2026-02-08T08:00:00.000Z',
    ingredients: [
      { name: 'Rau muống', quantity: 500, unit: 'g' },
      { name: 'Tỏi', quantity: 8, unit: 'tép', notes: 'Đập dập, băm thô' },
      { name: 'Dầu ăn', quantity: 25, unit: 'ml' },
      { name: 'Dầu hào', quantity: 15, unit: 'ml' },
      { name: 'Nước mắm', quantity: 10, unit: 'ml' },
      { name: 'Muối', quantity: 3, unit: 'g' },
    ],
    steps: [
      {
        title: 'Sơ chế rau',
        description: 'Nhặt bỏ lá già, cắt khúc vừa ăn, rửa nhiều lần rồi để ráo.',
      },
      {
        title: 'Chần rau',
        description:
          'Đun sôi nồi nước với muối, chần rau 30 giây rồi vớt ra ngâm vào nước lạnh. Để rau ráo hoàn toàn.',
        timerMinutes: 2,
      },
      {
        title: 'Xào rau',
        description:
          'Phi tỏi với dầu đến khi vàng thơm. Cho rau vào xào trên lửa lớn, thêm dầu hào và nước mắm, đảo nhanh tay.',
        timerMinutes: 4,
      },
      {
        title: 'Dọn món',
        description: 'Tắt bếp khi rau vừa chín giòn, nêm lại nếu cần và dùng ngay.',
      },
    ],
  },
  {
    slug: 'che-dau-xanh-nuoc-cot-dua',
    title: 'Chè đậu xanh nước cốt dừa',
    description:
      'Đậu xanh nấu mềm bùi, vị ngọt vừa và thơm béo nước cốt dừa, dùng nóng hoặc lạnh đều ngon.',
    instructions:
      'Ngâm đậu xanh, nấu cùng lá dứa đến khi hạt đậu mềm nhưng còn nguyên. Thêm đường và một nhúm muối. Nấu riêng nước cốt dừa với bột năng cho hơi sánh rồi rưới lên chè khi dùng.',
    prepTime: 20,
    cookTime: 45,
    servings: 5,
    difficulty: RecipeDifficulty.EASY,
    categorySlug: 'mon-trang-mieng',
    authorEmail: 'chef.nguyen@lethimcook.com',
    publishedAt: '2026-02-11T08:00:00.000Z',
    ingredients: [
      { name: 'Đậu xanh cà vỏ', quantity: 250, unit: 'g' },
      { name: 'Đường', quantity: 130, unit: 'g' },
      { name: 'Nước cốt dừa', quantity: 300, unit: 'ml' },
      { name: 'Lá dứa', quantity: 3, unit: 'lá' },
      { name: 'Bột năng', quantity: 10, unit: 'g' },
      { name: 'Muối', quantity: 2, unit: 'g' },
    ],
    steps: [
      {
        title: 'Ngâm đậu',
        description: 'Vo sạch đậu xanh, ngâm trong nước ấm 2 giờ rồi rửa lại và để ráo.',
        timerMinutes: 120,
      },
      {
        title: 'Nấu đậu',
        description:
          'Cho đậu, lá dứa và 1,2 lít nước vào nồi. Nấu lửa vừa đến khi đậu mềm, thỉnh thoảng hớt bọt.',
        timerMinutes: 35,
      },
      {
        title: 'Nêm chè',
        description: 'Thêm đường và muối, khuấy nhẹ để đường tan. Nấu thêm 5 phút rồi tắt bếp.',
        timerMinutes: 5,
      },
      {
        title: 'Nấu nước cốt dừa',
        description:
          'Đun nước cốt dừa với bột năng đã hòa tan trong ít nước và một nhúm muối đến khi hơi sánh.',
      },
      {
        title: 'Thưởng thức',
        description:
          'Múc chè ra bát, rưới nước cốt dừa lên trên. Dùng nóng hoặc để nguội rồi thêm đá.',
      },
    ],
  },
];

export const REAL_RECIPE_AUTHOR_EMAILS = [
  'chef.nguyen@lethimcook.com',
  'chef.tran@lethimcook.com',
  'chef.le@lethimcook.com',
  'chef.pham@lethimcook.com',
  'chef.vo@lethimcook.com',
] as const;
