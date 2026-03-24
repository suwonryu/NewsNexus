import { cache } from 'react';
import { getArticlesByDate } from './articleServerApi';

export const SITEMAP_CHUNK_SIZE = readIntEnv('SITEMAP_CHUNK_SIZE', 1000, 100, 5000);
const SITEMAP_MAX_URLS = readIntEnv('SITEMAP_MAX_URLS', 10000, 200, 50000);
const SITEMAP_MAX_DAYS = readIntEnv('SITEMAP_MAX_DAYS', 365, 31, 3650);
const SITEMAP_MAX_PAGES_PER_DAY = readIntEnv('SITEMAP_MAX_PAGES_PER_DAY', 20, 1, 200);

export interface SitemapArticleEntry {
  id: number;
  lastModified: string | null;
}

export const getSitemapArticleEntries = cache(async (): Promise<SitemapArticleEntry[]> => {
  const entries: SitemapArticleEntry[] = [];
  const seen = new Set<number>();

  for (
    let dayOffset = 0;
    dayOffset < SITEMAP_MAX_DAYS && entries.length < SITEMAP_MAX_URLS;
    dayOffset += 1
  ) {
    const targetDate = getIsoDateWithOffset(dayOffset);
    let cursor: string | null = null;
    let pageGuard = 0;

    do {
      const page = await getArticlesByDate(targetDate, cursor, 50);

      for (const item of page.items) {
        if (item.id === null || seen.has(item.id)) {
          continue;
        }

        seen.add(item.id);
        entries.push({
          id: item.id,
          lastModified: normalizeLastModified(item.publishedDate),
        });

        if (entries.length >= SITEMAP_MAX_URLS) {
          break;
        }
      }

      cursor = page.nextCursor;
      pageGuard += 1;
    } while (cursor && entries.length < SITEMAP_MAX_URLS && pageGuard < SITEMAP_MAX_PAGES_PER_DAY);
  }

  return entries;
});

export const getSitemapChunkCount = cache(async () => {
  const entries = await getSitemapArticleEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
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

function normalizeLastModified(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }

  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function getIsoDateWithOffset(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
