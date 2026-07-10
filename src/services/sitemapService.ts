import { unstable_cache } from 'next/cache';
import { getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import { getDailyBriefing } from './articleServerApi';

export const SITEMAP_CHUNK_SIZE = readIntEnv('SITEMAP_CHUNK_SIZE', 500, 50, 5000);
export const SITEMAP_REVALIDATE_SECONDS = readIntEnv(
  'SITEMAP_REVALIDATE_SECONDS',
  1800,
  60,
  86400,
);
const SITEMAP_BRIEFING_MAX_DAYS = readIntEnv('SITEMAP_BRIEFING_MAX_DAYS', 30, 0, 3650);

export interface SitemapEntry {
  path: string;
  lastModified: string | null;
  changeFrequency: 'hourly' | 'daily';
  priority: string;
}

const loadSitemapEntries = async (): Promise<SitemapEntry[]> => {
  const entries: SitemapEntry[] = [
    {
      path: '/',
      lastModified: new Date().toISOString(),
      changeFrequency: 'hourly',
      priority: '1.0',
    },
  ];
  entries.push(...(await getReadyBriefingSitemapEntries()));

  return entries;
};

const getCachedSitemapEntries = unstable_cache(loadSitemapEntries, ['sitemap-entries-v2'], {
  revalidate: SITEMAP_REVALIDATE_SECONDS,
});

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return getCachedSitemapEntries();
}

export async function getSitemapChunkCount(): Promise<number> {
  const entries = await getSitemapEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
}

async function getReadyBriefingSitemapEntries(): Promise<SitemapEntry[]> {
  if (SITEMAP_BRIEFING_MAX_DAYS <= 0) {
    return [];
  }

  const entries: SitemapEntry[] = [];

  for (let dayOffset = 1; dayOffset <= SITEMAP_BRIEFING_MAX_DAYS; dayOffset += 1) {
    const targetDate = getKoreaIsoDateWithOffset(dayOffset);
    const briefing = await getDailyBriefing(targetDate);

    if (briefing.status !== 'READY') {
      continue;
    }

    entries.push({
      path: `/briefing/${targetDate}`,
      lastModified: normalizeLastModified(briefing.generatedAt ?? targetDate),
      changeFrequency: 'daily',
      priority: '0.8',
    });
  }

  return entries;
}

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
