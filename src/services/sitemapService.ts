import { cache } from 'react';
import { getArticleIdsForSitemap } from './articleServerApi';

export const SITEMAP_CHUNK_SIZE = readIntEnv('SITEMAP_CHUNK_SIZE', 1000, 100, 5000);
const SITEMAP_MAX_URLS = readIntEnv('SITEMAP_MAX_URLS', 10000, 200, 50000);
const SITEMAP_MAX_DAYS = readIntEnv('SITEMAP_MAX_DAYS', 365, 31, 3650);
const SITEMAP_MAX_PAGES_PER_DAY = readIntEnv('SITEMAP_MAX_PAGES_PER_DAY', 20, 1, 200);

export const getSitemapArticleIds = cache(async () =>
  getArticleIdsForSitemap({
    limit: SITEMAP_MAX_URLS,
    maxDaysToScan: SITEMAP_MAX_DAYS,
    pageSize: 50,
    maxPagesPerDay: SITEMAP_MAX_PAGES_PER_DAY,
  }),
);

export const getSitemapChunkCount = cache(async () => {
  const articleIds = await getSitemapArticleIds();
  return Math.max(1, Math.ceil(articleIds.length / SITEMAP_CHUNK_SIZE));
});

function readIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
