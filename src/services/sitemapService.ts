import { cache } from 'react';
import { getArticlesByDate, getDailyBriefing } from './articleServerApi';

export const SITEMAP_CHUNK_SIZE = readIntEnv('SITEMAP_CHUNK_SIZE', 1000, 100, 5000);
const SITEMAP_MAX_URLS = readIntEnv('SITEMAP_MAX_URLS', 10000, 200, 50000);
const SITEMAP_MAX_DAYS = readIntEnv('SITEMAP_MAX_DAYS', 365, 31, 3650);
const SITEMAP_MAX_PAGES_PER_DAY = readIntEnv('SITEMAP_MAX_PAGES_PER_DAY', 20, 1, 200);

export interface SitemapEntry {
  path: string;
  lastModified: string | null;
  changeFrequency: 'hourly' | 'daily';
  priority: string;
}

export const getSitemapEntries = cache(async (): Promise<SitemapEntry[]> => {
  const entries: SitemapEntry[] = [
    {
      path: '/',
      lastModified: new Date().toISOString(),
      changeFrequency: 'hourly',
      priority: '1.0',
    },
  ];
  const articleEntries: SitemapEntry[] = [];
  const seen = new Set<number>();

  for (
    let dayOffset = 0;
    dayOffset < SITEMAP_MAX_DAYS && articleEntries.length < SITEMAP_MAX_URLS;
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
        articleEntries.push({
          path: `/news/${item.id}`,
          lastModified: normalizeLastModified(item.publishedDate),
          changeFrequency: 'daily',
          priority: '0.7',
        });

        if (articleEntries.length >= SITEMAP_MAX_URLS) {
          break;
        }
      }

      cursor = page.nextCursor;
      pageGuard += 1;
    } while (
      cursor &&
      articleEntries.length < SITEMAP_MAX_URLS &&
      pageGuard < SITEMAP_MAX_PAGES_PER_DAY
    );
  }

  entries.push(...articleEntries);
  entries.push(...(await getReadyBriefingSitemapEntries()));

  return entries;
});

export const getSitemapChunkCount = cache(async () => {
  const entries = await getSitemapEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
});

const getReadyBriefingSitemapEntries = cache(async (): Promise<SitemapEntry[]> => {
  const entries: SitemapEntry[] = [];

  for (let dayOffset = 1; dayOffset < SITEMAP_MAX_DAYS; dayOffset += 1) {
    const targetDate = getIsoDateWithOffset(dayOffset);
    const briefing = await getDailyBriefing(targetDate);

    if (briefing.status !== 'READY') {
      continue;
    }

    entries.push({
      path: `/briefing/${targetDate}`,
      lastModified: normalizeLastModified(briefing.generatedAt ?? targetDate),
      changeFrequency: 'daily',
      priority: '0.6',
    });
  }

  return entries;
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
