import { unstable_cache } from 'next/cache';
import { getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import { getArticleDetail, getDailyBriefing } from './articleServerApi';
import { getAllReadyBriefings } from './briefingArchive';
import { evaluateArticleIndexEligibility } from './contentQuality';
import { getPublishedTopics } from './topics';

const ARTICLE_SITEMAP_LOOKBACK_DAYS = 14;
export const SITEMAP_CHUNK_SIZE = readIntEnv('SITEMAP_CHUNK_SIZE', 500, 50, 5000);
export const SITEMAP_REVALIDATE_SECONDS = readIntEnv(
  'SITEMAP_REVALIDATE_SECONDS',
  1800,
  60,
  86400,
);
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
  entries.push({
    path: '/archive',
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: '0.9',
  });
  entries.push({
    path: '/about',
    lastModified: null,
    changeFrequency: 'daily',
    priority: '0.6',
  });
  entries.push(...(await getReadyBriefingSitemapEntries()));
  entries.push(...(await getIndexableArticleSitemapEntries()));
  entries.push(
    ...(await getPublishedTopics()).map((topic) => ({
      path: `/topics/${topic.slug}`,
      lastModified: topic.briefings[0]?.date ?? null,
      changeFrequency: 'daily' as const,
      priority: '0.8',
    })),
  );

  return entries;
};

const getCachedSitemapEntries = unstable_cache(loadSitemapEntries, ['sitemap-entries-v7'], {
  revalidate: SITEMAP_REVALIDATE_SECONDS,
});

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  return getCachedSitemapEntries();
}

async function getIndexableArticleSitemapEntries(): Promise<SitemapEntry[]> {
  const dates = Array.from(
    { length: ARTICLE_SITEMAP_LOOKBACK_DAYS },
    (_, dayOffset) => getKoreaIsoDateWithOffset(dayOffset),
  );
  const briefings = await mapWithConcurrency(dates, 4, (date) =>
    getDailyBriefing(date, { enqueue: false }),
  );
  const candidateDates = new Map<number, string>();

  for (const briefing of briefings) {
    if (briefing.status !== 'READY') {
      continue;
    }
    for (const article of briefing.featuredArticles.slice(0, 5)) {
      if (article.id !== null && !candidateDates.has(article.id)) {
        candidateDates.set(article.id, briefing.date);
      }
    }
  }

  const articles = await mapWithConcurrency([...candidateDates.keys()], 6, getArticleDetail);
  const representatives = new Map<string, NonNullable<(typeof articles)[number]>>();

  for (const article of articles) {
    if (
      !article ||
      !evaluateArticleIndexEligibility(article).passes
    ) {
      continue;
    }
    const clusterKey = article.analysis?.clusterId ?? String(article.id);
    const current = representatives.get(clusterKey);
    if (
      !current ||
      (article.analysis?.editorialPriority ?? 0) >
        (current.analysis?.editorialPriority ?? 0)
    ) {
      representatives.set(clusterKey, article);
    }
  }

  return [...representatives.values()]
    .sort((left, right) => right.id - left.id)
    .map((article) => ({
      path: `/news/${article.id}`,
      lastModified: normalizeLastModified(
        article.publishedDate ?? candidateDates.get(article.id),
      ),
      changeFrequency: 'daily',
      priority: '0.7',
    }));
}

export async function getSitemapChunkCount(): Promise<number> {
  const entries = await getSitemapEntries();
  return Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
}

async function getReadyBriefingSitemapEntries(): Promise<SitemapEntry[]> {
  const briefings = await getAllReadyBriefings();
  return briefings
    .filter((briefing) => briefing.summary.trim().length > 0)
    .map((briefing) => ({
      path: `/briefing/${briefing.date}`,
      lastModified: normalizeLastModified(briefing.updatedAt ?? briefing.publishedAt ?? briefing.date),
      changeFrequency: 'daily',
      priority: '0.8',
    }));
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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
