import type { RecipeDetail } from '../types/recipe'

/**
 * Static sample content for the public blog UI.
 *
 * Nothing here talks to the network: the two async helpers below only add a
 * short simulated latency so loading states are real. They mirror the shape of
 * the future REST endpoints, which lets issue #20/#21 swap them for the actual
 * API without touching the pages.
 */

const MOCK_LATENCY_MS = 150

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const STATIC_RECIPES: RecipeDetail[] = [
  {
    id: 'static-1',
    title: 'Phở bò tái nạm',
    slug: 'pho-bo-tai-nam',
    description:
      'Nước dùng trong và ngọt từ xương bò hầm chậm, thịt tái mềm, nạm gầu béo ngậy — bát phở chuẩn vị Hà Nội cho cả gia đình.',
    prepTime: 30,
    cookTime: 180,
    servings: 4,
    difficulty: 'MEDIUM',
    status: 'PUBLISHED',
    categoryId: 'cat-main',
    categoryName: 'Món chính',
    authorId: 'user-1',
    authorName: 'Nguyễn Đình Hiếu',
    publishedAt: '2026-09-02T08:00:00.000Z',
    createdAt: '2026-08-28T08:00:00.000Z',
    ingredients: [
      { id: 'i-1', name: 'Xương ống bò', quantity: 1, unit: 'kg', orderIndex: 0 },
      { id: 'i-2', name: 'Thịt bò tái, nạm', quantity: 500, unit: 'g', orderIndex: 1 },
      { id: 'i-3', name: 'Hành củ nướng', quantity: 2, unit: 'củ', orderIndex: 2 },
      { id: 'i-4', name: 'Gừng nướng', quantity: 1, unit: 'củ', orderIndex: 3 },
      { id: 'i-5', name: 'Quế, hoa hồi, đinh hương', quantity: 1, unit: 'vài', notes: 'Túi gia vị hầm', orderIndex: 4 },
      { id: 'i-6', name: 'Bánh phở tươi', quantity: 800, unit: 'g', orderIndex: 5 },
      { id: 'i-7', name: 'Rau thơm, chanh, ớt', quantity: 1, unit: 'lượng', orderIndex: 6 },
    ],
    steps: [
      {
        id: 's-1',
        stepNumber: 1,
        title: 'Sơ chế xương và thịt',
        description: 'Rửa xương với nước lạnh, chần sôi 5 phút rồi xả sạch bọt để nước dùng được trong.',
        timerMinutes: 20,
      },
      {
        id: 's-2',
        stepNumber: 2,
        title: 'Hầm nước dùng',
        description:
          'Cho xương vào nồi 3 lít nước, thêm hành và gừng nướng cùng túi gia vị, hầm nhỏ lửa 3 giờ và hớt bọt thường xuyên.',
        timerMinutes: 180,
      },
      {
        id: 's-3',
        stepNumber: 3,
        title: 'Luộc thịt và thái lát',
        description: 'Luộc riêng thịt tái và nạm trong nước dùng, vớt ra ngâm nước lạnh rồi thái mỏng vừa ăn.',
        timerMinutes: 30,
      },
      {
        id: 's-4',
        stepNumber: 4,
        title: 'Trần bánh và ăn kèm',
        description: 'Trần bánh phở trong nước sôi, xếp thịt lên trên, chan nước dùng sôi, thêm rau thơm và chanh ớt.',
      },
    ],
    images: [],
  },
  {
    id: 'static-2',
    title: 'Bún chả Hà Nội',
    slug: 'bun-cha-ha-noi',
    description:
      'Chả viên và chả miếng nướng than hoa, ăn kèm bún, rau sống và nước chấm pha chua ngọt — món đường phố khiến ai cũng nhớ.',
    prepTime: 25,
    cookTime: 30,
    servings: 3,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    categoryId: 'cat-main',
    categoryName: 'Món chính',
    authorId: 'user-1',
    authorName: 'Nguyễn Đình Hiếu',
    publishedAt: '2026-08-21T08:00:00.000Z',
    createdAt: '2026-08-18T08:00:00.000Z',
    ingredients: [
      { id: 'i-8', name: 'Thịt lợn xay', quantity: 400, unit: 'g', orderIndex: 0 },
      { id: 'i-9', name: 'Bún tươi', quantity: 500, unit: 'g', orderIndex: 1 },
      { id: 'i-10', name: 'Nước mắm', quantity: 4, unit: 'ml', orderIndex: 2 },
      { id: 'i-11', name: 'Đường, giấm, ớt', quantity: 1, unit: 'lượng', orderIndex: 3 },
      { id: 'i-12', name: 'Rau sống, xà lách, rau thơm', quantity: 1, unit: 'tô', orderIndex: 4 },
    ],
    steps: [
      {
        id: 's-5',
        stepNumber: 1,
        title: 'Ướp chả',
        description: 'Trộn thịt xay với nước mắm, tiêu, hành băm, ướp 15 phút cho thấm đều.',
        timerMinutes: 15,
      },
      {
        id: 's-6',
        stepNumber: 2,
        title: 'Nướng chả',
        description: 'Vo viên và cắt miếng rồi nướng trên than hoa, trở đều tay đến khi vàng xém thơm.',
        timerMinutes: 20,
      },
      {
        id: 's-7',
        stepNumber: 3,
        title: 'Pha nước chấm',
        description: 'Pha nước mắm, đường, giấm và nước theo tỷ lệ 1:1:1:2, thêm ớt và tỏi băm.',
      },
      {
        id: 's-8',
        stepNumber: 4,
        title: 'Thành phẩm',
        description: 'Gắp bún ra bát, thêm chả, rau sống và chan nước chấm, ăn kèm dưa góp.',
      },
    ],
    images: [],
  },
  {
    id: 'static-3',
    title: 'Canh chua cá hồi',
    slug: 'canh-chua-ca-hoi',
    description:
      'Nước canh chua thanh từ me và cà chua, thịt cá hồi béo ngậy không tanh, ăn cùng bông so đũa và rau mùi.',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    categoryId: 'cat-soup',
    categoryName: 'Món canh',
    authorId: 'user-2',
    authorName: 'Trần Ngọc Mai',
    publishedAt: '2026-08-05T08:00:00.000Z',
    createdAt: '2026-08-01T08:00:00.000Z',
    ingredients: [
      { id: 'i-13', name: 'Phi lê cá hồi', quantity: 400, unit: 'g', orderIndex: 0 },
      { id: 'i-14', name: 'Me chua', quantity: 2, unit: 'muỗng', orderIndex: 1 },
      { id: 'i-15', name: 'Cà chua', quantity: 2, unit: 'quả', orderIndex: 2 },
      { id: 'i-16', name: 'Thơm (dứa)', quantity: 1, unit: 'miếng', orderIndex: 3 },
      { id: 'i-17', name: 'Đậu bắp', quantity: 4, unit: 'quả', orderIndex: 4 },
      { id: 'i-18', name: 'Nước mắm, đường, ớt', quantity: 1, unit: 'lượng', orderIndex: 5 },
    ],
    steps: [
      {
        id: 's-9',
        stepNumber: 1,
        title: 'Sơ chế cá',
        description: 'Rửa cá với nước muối và gừng để khử tanh, cắt miếng vừa ăn, thấm khô.',
      },
      {
        id: 's-10',
        stepNumber: 2,
        title: 'Xào thơm và cà chua',
        description: 'Phi thơm hành, thêm cà chua và thơm xào tới khi ra màu đỏ đẹp.',
        timerMinutes: 5,
      },
      {
        id: 's-11',
        stepNumber: 3,
        title: 'Nấu nước canh',
        description: 'Cho 1,5 lít nước, thêm me và nêm nếm chua ngọt, thả cá và rau vào nấu chín.',
        timerMinutes: 15,
      },
    ],
    images: [],
  },
  {
    id: 'static-4',
    title: 'Gỏi cuốn tôm thịt',
    slug: 'goi-cuon-tom-thit',
    description:
      'Bánh tráng cuốn dai, tôm đỏ, thịt heo và rau xanh chấm tương pha — món khai vị nhẹ nhàng, hợp cho mọi buổi họp gia đình.',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    categoryId: 'cat-appetizer',
    categoryName: 'Món khai vị',
    authorId: 'user-1',
    authorName: 'Nguyễn Đình Hiếu',
    publishedAt: '2026-07-19T08:00:00.000Z',
    createdAt: '2026-07-15T08:00:00.000Z',
    ingredients: [
      { id: 'i-19', name: 'Tôm sú', quantity: 200, unit: 'g', orderIndex: 0 },
      { id: 'i-20', name: 'Thịt ba chỉ', quantity: 200, unit: 'g', orderIndex: 1 },
      { id: 'i-21', name: 'Bánh tráng cuốn', quantity: 1, unit: 'tấm', orderIndex: 2 },
      { id: 'i-22', name: 'Bún tươi', quantity: 200, unit: 'g', orderIndex: 3 },
      { id: 'i-23', name: 'Xà lách, rau thơm, giá đỗ', quantity: 1, unit: 'tô', orderIndex: 4 },
      { id: 'i-24', name: 'Tương đậu phộng', quantity: 3, unit: 'muỗng', orderIndex: 5 },
    ],
    steps: [
      {
        id: 's-12',
        stepNumber: 1,
        title: 'Luộc tôm và thịt',
        description: 'Luộc tôm và thịt chín tới, thịt cắt lát mỏng, tôm chẻ đôi bỏ chỉ.',
        timerMinutes: 15,
      },
      {
        id: 's-13',
        stepNumber: 2,
        title: 'Làm mềm bánh tráng',
        description: 'Nhúng nhanh bánh tráng qua nước ấm cho mềm, đặt lên thớt sạch.',
      },
      {
        id: 's-14',
        stepNumber: 3,
        title: 'Cuốn và chấm',
        description: 'Xếp rau, bún, thịt, tôm rồi cuốn chặt tay, chấm tương đậu phộng pha loãng.',
      },
    ],
    images: [],
  },
  {
    id: 'static-5',
    title: 'Gà nướng mật ong',
    slug: 'ga-nuong-mat-ong',
    description:
      'Da gà vàng óng, thịt mềm ngấm mật ong và ngũ vị hương, nướng lò đến khi caramelised — món chính được yêu thích nhất tuần.',
    prepTime: 40,
    cookTime: 50,
    servings: 4,
    difficulty: 'MEDIUM',
    status: 'PUBLISHED',
    categoryId: 'cat-grill',
    categoryName: 'Món nướng',
    authorId: 'user-2',
    authorName: 'Trần Ngọc Mai',
    publishedAt: '2026-07-02T08:00:00.000Z',
    createdAt: '2026-06-28T08:00:00.000Z',
    ingredients: [
      { id: 'i-25', name: 'Đùi và cánh gà', quantity: 1, unit: 'con', orderIndex: 0 },
      { id: 'i-26', name: 'Mật ong', quantity: 3, unit: 'muỗng', orderIndex: 1 },
      { id: 'i-27', name: 'Nước mắm, dầu hào', quantity: 2, unit: 'muỗng', orderIndex: 2 },
      { id: 'i-28', name: 'Tỏi, gừng, ngũ vị hương', quantity: 1, unit: 'lượng', orderIndex: 3 },
      { id: 'i-29', name: 'Mè rang', quantity: 1, unit: 'muỗng', orderIndex: 4 },
    ],
    steps: [
      {
        id: 's-15',
        stepNumber: 1,
        title: 'Ướp gà',
        description: 'Trộn đều tỏi gừng băm, nước mắm, dầu hào, mật ong và ngũ vị hương, ướp gà ít nhất 30 phút.',
        timerMinutes: 30,
      },
      {
        id: 's-16',
        stepNumber: 2,
        title: 'Nướng lần một',
        description: 'Nướng ở 200°C trong 25 phút, phết lại nước ướp sau 15 phút.',
        timerMinutes: 25,
      },
      {
        id: 's-17',
        stepNumber: 3,
        title: 'Nướng caramel',
        description: 'Tăng nhiệt lên 220°C, nướng thêm 10 phút để da vàng bóng, rắc mè rang và thái miếng.',
        timerMinutes: 10,
      },
    ],
    images: [],
  },
  {
    id: 'static-6',
    title: 'Chè chuối nướng',
    slug: 'chuoi-nuong',
    description:
      'Chuối chín nướng caramelised trong lá dừa, dẻo ngọt thơm mùi nước cốt dừa — món tráng miệng giản dị kết thúc bữa tối ấm áp.',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    categoryId: 'cat-dessert',
    categoryName: 'Món tráng miệng',
    authorId: 'user-1',
    authorName: 'Nguyễn Đình Hiếu',
    publishedAt: '2026-06-14T08:00:00.000Z',
    createdAt: '2026-06-10T08:00:00.000Z',
    ingredients: [
      { id: 'i-30', name: 'Chuối chín', quantity: 6, unit: 'quả', orderIndex: 0 },
      { id: 'i-31', name: 'Nước cốt dừa', quantity: 200, unit: 'ml', orderIndex: 1 },
      { id: 'i-32', name: 'Đường thốt nốt', quantity: 80, unit: 'g', orderIndex: 2 },
      { id: 'i-33', name: 'Lá dừa', quantity: 4, unit: 'tấm', orderIndex: 3 },
      { id: 'i-34', name: 'Muối, mè rang', quantity: 1, unit: 'lượng', orderIndex: 4 },
    ],
    steps: [
      {
        id: 's-18',
        stepNumber: 1,
        title: 'Pha hỗn hợp cốt dừa',
        description: 'Trộn nước cốt dừa với đường thốt nốt và một nhúm muối đến khi đường tan.',
      },
      {
        id: 's-19',
        stepNumber: 2,
        title: 'Cuốn chuối',
        description: 'Bóc chuối, đặt lên lá dừa, rưới hỗn hợp rồi gói kín bằng lá và dây.',
      },
      {
        id: 's-20',
        stepNumber: 3,
        title: 'Nướng',
        description: 'Nướng ở 190°C trong 20 phút, mở lá nướng thêm 5 phút cho mặt caramel hoá.',
        timerMinutes: 25,
      },
    ],
    images: [],
  },
]

export const STATIC_CATEGORIES: string[] = [
  ...new Set(STATIC_RECIPES.map(recipe => recipe.categoryName ?? 'Khác')),
]

export interface StaticRecipeListQuery {
  /** Case-insensitive match on title and description. */
  q?: string
  category?: string | null
  page?: number
  pageSize?: number
}

export interface StaticRecipeList {
  items: RecipeDetail[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

/** Same contract as the future `GET /recipes` endpoint (offset pagination). */
export async function listStaticRecipes(query: StaticRecipeListQuery = {}): Promise<StaticRecipeList> {
  await delay(MOCK_LATENCY_MS)

  const search = query.q?.trim().toLowerCase() ?? ''
  const pageSize = query.pageSize ?? 4

  const filtered = STATIC_RECIPES.filter(recipe => {
    const matchesCategory = !query.category || recipe.categoryName === query.category
    const matchesSearch =
      !search ||
      recipe.title.toLowerCase().includes(search) ||
      recipe.description.toLowerCase().includes(search)
    return matchesCategory && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(Math.max(1, query.page ?? 1), totalPages)
  const start = (page - 1) * pageSize

  return {
    items: filtered.slice(start, start + pageSize),
    meta: { page, pageSize, totalCount: filtered.length, totalPages },
  }
}

/** Same contract as the future `GET /recipes/{slug}` endpoint. */
export async function getStaticRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  await delay(MOCK_LATENCY_MS)
  return STATIC_RECIPES.find(recipe => recipe.slug === slug) ?? null
}
