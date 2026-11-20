import { describe, expect, it, vi } from 'vitest';

import { buildSitemapXml, processSitemap } from '../src/infrastructure/jobs/sitemapProcessor.js';

const recipes = [
  { slug: 'pho-bo', updatedAt: new Date('2026-11-20T00:00:00.000Z') },
  { slug: 'fish-&-chips', updatedAt: new Date('2026-11-19T00:00:00.000Z') },
];
const categories = [{ slug: 'mon-chinh', updatedAt: new Date('2026-11-18T00:00:00.000Z') }];

describe('sitemap generation', () => {
  it('generates escaped standard XML for recipes and categories', () => {
    const xml = buildSitemapXml('https://example.test', recipes, categories);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://example.test/recipes/pho-bo</loc>');
    expect(xml).toContain('fish-%26-chips');
    expect(xml).toContain('<lastmod>2026-11-20T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).toContain('<loc>https://example.test/categories/mon-chinh</loc>');
  });

  it('queries published recipes and uploads the sitemap, while Google ping is advisory', async () => {
    const uploadFile = vi.fn().mockResolvedValue('https://cdn.test/sitemap.xml');
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const prisma = {
      recipe: { findMany: vi.fn().mockResolvedValue(recipes) },
      category: { findMany: vi.fn().mockResolvedValue(categories) },
    };

    const result = await processSitemap('manual', {
      prisma: prisma as never,
      storage: { uploadFile } as never,
      fetcher,
      baseUrl: 'https://example.test/',
    });

    expect(result).toMatchObject({ url: 'https://cdn.test/sitemap.xml', recipeCount: 2, categoryCount: 1 });
    expect(prisma.recipe.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', isDeleted: false },
      select: { slug: true, updatedAt: true },
    }));
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isDeleted: false },
    }));
    expect(uploadFile).toHaveBeenCalledWith('sitemap.xml', expect.any(Buffer), 'application/xml');
    expect(fetcher).toHaveBeenCalledWith('https://www.google.com/ping?sitemap=https%3A%2F%2Fcdn.test%2Fsitemap.xml');
  });

  it('does not fail generation when Google is unavailable', async () => {
    const storage = { uploadFile: vi.fn().mockResolvedValue('https://cdn.test/sitemap.xml') };
    const prisma = {
      recipe: { findMany: vi.fn().mockResolvedValue([]) },
      category: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await expect(processSitemap('scheduled', {
      prisma: prisma as never,
      storage: storage as never,
      fetcher: vi.fn().mockRejectedValue(new Error('network down')),
      baseUrl: 'https://example.test',
    })).resolves.toMatchObject({ recipeCount: 0, categoryCount: 0 });
  });
});
