import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

import { createSitemapXml, generateSitemap, saveSitemap } from '../src/infrastructure/jobs/SitemapService.js';

describe('sitemap generation helpers', () => {
  it('creates absolute recipe and category entries with required sitemap fields', () => {
    const updatedAt = new Date('2026-11-16T00:00:00.000Z');
    const xml = createSitemapXml(
      [{ slug: 'pho-bo', updatedAt }],
      [{ slug: 'mon-chinh', updatedAt }],
      'https://culinary.example/',
    );

    expect(xml).toContain('<loc>https://culinary.example/recipes/pho-bo</loc>');
    expect(xml).toContain('<loc>https://culinary.example/categories/mon-chinh</loc>');
    expect(xml).toContain('<lastmod>2026-11-16T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>0.8</priority>');
    expect(xml).toContain('<priority>0.6</priority>');
    expect(xml).toContain('</urlset>');
  });

  it('encodes path segments so recipe slugs cannot inject markup', () => {
    const xml = createSitemapXml(
      [{ slug: 'pho&<bo', updatedAt: new Date('2026-11-16T00:00:00.000Z') }],
      [],
      'https://culinary.example',
    );

    expect(xml).toContain('/recipes/pho%26%3Cbo');
    expect(xml).not.toContain('/recipes/pho&<bo');
  });

  it('writes sitemap atomically to the configured path', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lethimcook-sitemap-'));
    const path = join(directory, 'sitemap.xml');
    const content = '<?xml version="1.0"?><urlset></urlset>';

    try {
      await saveSitemap(content, path);
      await saveSitemap(`${content}<updated />`, path);
      await expect(readFile(path, 'utf8')).resolves.toBe(`${content}<updated />`);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('stores published recipe and category entries even if Google notification fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lethimcook-sitemap-'));
    const path = join(directory, 'sitemap.xml');
    const updatedAt = new Date('2026-11-16T00:00:00.000Z');
    const recipeFindMany = vi.fn().mockResolvedValue([{ slug: 'pho-bo', updatedAt }]);
    const categoryFindMany = vi.fn().mockResolvedValue([{ slug: 'mon-chinh', updatedAt }]);
    const database = {
      recipe: { findMany: recipeFindMany },
      category: { findMany: categoryFindMany },
    } as unknown as PrismaClient;
    const notifyGoogle = vi.fn().mockRejectedValue(new Error('Unavailable'));

    try {
      await expect(generateSitemap(database, {
        baseUrl: 'https://culinary.example',
        outputPath: path,
        notifyGoogle,
      })).resolves.toBeUndefined();
      const xml = await readFile(path, 'utf8');

      expect(recipeFindMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'PUBLISHED', isDeleted: false },
      }));
      expect(categoryFindMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false },
      }));
      expect(xml).toContain('/recipes/pho-bo');
      expect(xml).toContain('/categories/mon-chinh');
      expect(notifyGoogle).toHaveBeenCalledWith('https://culinary.example/sitemap.xml');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
