import { type PrismaClient } from '@prisma/client';

import { env } from '../../config-middleware/config/env.js';
import { logger } from '../../config-middleware/config/logger.js';
import { type IFileStorageService } from '../../application/interfaces/IFileStorageService.js';

export interface SitemapDependencies {
  prisma: Pick<PrismaClient, 'recipe' | 'category'>;
  storage: IFileStorageService;
  fetcher?: typeof fetch;
  baseUrl?: string;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character]!);
}

function urlEntry(
  url: string,
  lastModified: Date | null | undefined,
  changeFrequency: 'daily' | 'weekly',
  priority: string,
): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    lastModified ? `    <lastmod>${lastModified.toISOString()}</lastmod>` : undefined,
    `    <changefreq>${changeFrequency}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export function buildSitemapXml(
  baseUrl: string,
  recipes: Array<{ slug: string; updatedAt: Date }>,
  categories: Array<{ slug: string; updatedAt: Date }>,
): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const entries = [
    urlEntry(`${normalizedBase}/`, undefined, 'daily', '1.0'),
    urlEntry(`${normalizedBase}/recipes`, undefined, 'daily', '0.9'),
    ...categories.map((category) =>
      urlEntry(`${normalizedBase}/categories/${encodeURIComponent(category.slug)}`, category.updatedAt, 'weekly', '0.7'),
    ),
    ...recipes.map((recipe) =>
      urlEntry(`${normalizedBase}/recipes/${encodeURIComponent(recipe.slug)}`, recipe.updatedAt, 'weekly', '0.8'),
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

export async function processSitemap(
  _trigger: 'manual' | 'scheduled',
  dependencies: SitemapDependencies,
): Promise<{ url: string; recipeCount: number; categoryCount: number }> {
  const baseUrl = dependencies.baseUrl ?? env.SITEMAP_BASE_URL;
  const [recipes, categories] = await Promise.all([
    dependencies.prisma.recipe.findMany({
      where: { status: 'PUBLISHED', isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    }),
    dependencies.prisma.category.findMany({
      where: { isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    }),
  ]);
  const xml = buildSitemapXml(baseUrl, recipes, categories);
  const sitemapUrl = await dependencies.storage.uploadFile('sitemap.xml', Buffer.from(xml, 'utf8'), 'application/xml');

  try {
    const response = await (dependencies.fetcher ?? fetch)(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    );
    if (!response.ok) logger.warn({ status: response.status, sitemapUrl }, 'Google sitemap ping failed');
    else logger.info({ sitemapUrl }, 'Google sitemap ping completed');
  } catch (error) {
    // Search Console notification is advisory; the generated sitemap remains valid.
    logger.warn({ err: error, sitemapUrl }, 'Google sitemap ping unavailable');
  }

  logger.info(
    { sitemapUrl, recipeCount: recipes.length, categoryCount: categories.length },
    'Sitemap generated',
  );
  return { url: sitemapUrl, recipeCount: recipes.length, categoryCount: categories.length };
}
