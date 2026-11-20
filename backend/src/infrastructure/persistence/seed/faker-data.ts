/**
 * Static catalog data used by the database seed.
 *
 * Recipe content lives in recipe-data.ts. This file is kept for the category
 * seeder's stable import path and no longer generates recipe content.
 */
export const vietnameseCategories = [
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
] as const;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
