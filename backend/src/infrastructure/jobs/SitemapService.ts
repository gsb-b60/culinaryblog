import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';

import { env } from '../../config-middleware/config/env.js';
import { logger } from '../../config-middleware/config/logger.js';
import { prisma } from '../../config-middleware/shared/database/client.js';

export interface SitemapEntry {
  slug: string;
  updatedAt: Date;
}

export interface SitemapGenerationOptions {
  baseUrl?: string;
  outputPath?: string;
  notifyGoogle?: (sitemapUrl: string) => Promise<void>;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createUrlEntry(
  url: URL,
  updatedAt: Date,
  changeFrequency: 'daily' | 'weekly',
  priority: string,
): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(url.toString())}</loc>`,
    `    <lastmod>${updatedAt.toISOString()}</lastmod>`,
    `    <changefreq>${changeFrequency}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export function createSitemapXml(
  recipes: SitemapEntry[],
  categories: SitemapEntry[],
  baseUrl: string,
): string {
  const normalizedBaseUrl = new URL(baseUrl);
  if (!normalizedBaseUrl.pathname.endsWith('/')) normalizedBaseUrl.pathname += '/';

  const recipeEntries = recipes.map(recipe => createUrlEntry(
    new URL(`recipes/${encodeURIComponent(recipe.slug)}`, normalizedBaseUrl),
    recipe.updatedAt,
    'weekly',
    '0.8',
  ));
  const categoryEntries = categories.map(category => createUrlEntry(
    new URL(`categories/${encodeURIComponent(category.slug)}`, normalizedBaseUrl),
    category.updatedAt,
    'daily',
    '0.6',
  ));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...recipeEntries,
    ...categoryEntries,
    '</urlset>',
    '',
  ].join('\n');
}

export function getSitemapPath(): string {
  return resolve(process.cwd(), env.SITEMAP_OUTPUT_DIR, 'sitemap.xml');
}

export async function saveSitemap(xml: string, sitemapPath = getSitemapPath()): Promise<void> {
  await mkdir(dirname(sitemapPath), { recursive: true });
  const temporaryPath = `${sitemapPath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, xml, { encoding: 'utf8' });
    await rename(temporaryPath, sitemapPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

async function pingGoogle(sitemapUrl: string): Promise<void> {
  const pingUrl = new URL('https://www.google.com/ping');
  pingUrl.searchParams.set('sitemap', sitemapUrl);
  const response = await fetch(pingUrl, {
    signal: AbortSignal.timeout(env.GOOGLE_SITEMAP_PING_TIMEOUT_MS),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`Google sitemap ping returned HTTP ${response.status}`);
}

export async function generateSitemap(
  database: PrismaClient = prisma,
  options: SitemapGenerationOptions = {},
): Promise<void> {
  const startedAt = performance.now();
  const [recipes, categories] = await Promise.all([
    database.recipe.findMany({
      where: { status: 'PUBLISHED', isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    database.category.findMany({
      where: { isDeleted: false },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  const baseUrl = options.baseUrl ?? env.SITEMAP_BASE_URL;
  const xml = createSitemapXml(recipes, categories, baseUrl);
  const sitemapPath = options.outputPath ?? getSitemapPath();
  await saveSitemap(xml, sitemapPath);

  const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();
  try {
    await (options.notifyGoogle ?? pingGoogle)(sitemapUrl);
  } catch (error) {
    logger.warn({
      errorName: error instanceof Error ? error.name : 'UnknownError',
      sitemapUrl,
    }, 'Google sitemap notification failed');
  }

  logger.info({
    recipeCount: recipes.length,
    categoryCount: categories.length,
    sitemapPath,
    durationMs: Math.round(performance.now() - startedAt),
  }, 'Sitemap generation completed');
}
