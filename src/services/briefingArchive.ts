import { getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import { getDailyBriefing } from './articleServerApi';
import {
  alignEditorialSummary,
  getTopicDisplayName,
  normalizeEditorialText,
} from './contentQuality';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';
const MIN_PRIMARY_ARCHIVE_ITEMS = 20;
const RECENT_ARCHIVE_LOOKBACK_DAYS = 7;

export interface BriefingArchiveItem {
  date: string;
  headline: string;
  summary: string;
  topicTags: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  qualityScore?: number;
  relevantArticleRatio?: number;
  representativeArticleCount?: number;
  uniqueSourceCount?: number;
}

export async function getBriefingArchive(monthCount = 12): Promise<BriefingArchiveItem[]> {
  const months = recentMonths(monthCount);
  try {
    const responses = await Promise.all(
      months.map(async ({ year, month }) => {
        const params = new URLSearchParams({
          year: String(year),
          month: String(month),
          status: 'READY',
        });
        const response = await fetch(`${KABANG_API_ROOT}/briefings?${params.toString()}`, {
          next: { revalidate: 1800 },
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) {
          throw new Error(`Archive API failed: ${response.status}`);
        }
        return (await response.json()) as BriefingArchiveItem[];
      }),
    );
    const items = responses
      .flat()
      .map(normalizeItem)
      .filter(isArchiveItem);
    if (items.length >= MIN_PRIMARY_ARCHIVE_ITEMS) {
      const recentItems = await buildCompatibilityArchive(RECENT_ARCHIVE_LOOKBACK_DAYS);
      return sortItems(mergeByDate(items, recentItems));
    }
    const compatibilityItems = await buildCompatibilityArchive();
    return sortItems(mergeByDate(items, compatibilityItems));
  } catch {
    // The compatibility path below keeps the archive usable during backend rollout.
  }

  return buildCompatibilityArchive();
}

export async function getAllReadyBriefings(): Promise<BriefingArchiveItem[]> {
  try {
    const response = await fetch(`${KABANG_API_ROOT}/briefings?status=READY`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new Error(`Archive API failed: ${response.status}`);
    }
    const items = ((await response.json()) as BriefingArchiveItem[])
      .map(normalizeItem)
      .filter(isArchiveItem);
    if (items.length > 0) {
      return sortItems(items);
    }
  } catch {
    // Use the rollout-compatible recent archive until the new endpoint is available.
  }
  return buildCompatibilityArchive();
}

async function buildCompatibilityArchive(dayCount = 30): Promise<BriefingArchiveItem[]> {
  const dayOffsets = Array.from({ length: dayCount }, (_, index) => index + 1);
  const items = await mapWithConcurrency<number, BriefingArchiveItem | null>(
    dayOffsets,
    6,
    async (dayOffset) => {
      const date = getKoreaIsoDateWithOffset(dayOffset);
      const briefing = await getDailyBriefing(date, { enqueue: false });
      if (briefing.status !== 'READY' || !briefing.summary) {
        return null;
      }
      const headline =
        briefing.editorialAnalysis?.keyChanges?.[0] ||
        briefing.keywords.slice(0, 3).join(' · ') ||
        `${date} 카카오뱅크 뉴스 브리핑`;
      return {
        date,
        headline,
        summary: alignEditorialSummary(headline, briefing.summary, 3),
        topicTags: briefing.keywords.slice(0, 3),
        publishedAt: briefing.generatedAt,
        updatedAt: briefing.generatedAt,
        qualityScore: briefing.qualityScore,
        relevantArticleRatio:
          briefing.relevantArticleRatio ??
          (briefing.articleCount > 0
            ? (briefing.articleCount - briefing.sentimentSummary.unrelatedCount) /
              briefing.articleCount
            : 0),
        representativeArticleCount:
          briefing.representativeArticleCount ?? briefing.featuredArticles.length,
        uniqueSourceCount:
          briefing.uniqueSourceCount ??
          new Set(briefing.featuredArticles.map((article) => article.sourceName)).size,
      } satisfies BriefingArchiveItem;
    },
  );
  return sortItems(items.filter(isArchiveItem));
}

function normalizeItem(value: Partial<BriefingArchiveItem>): BriefingArchiveItem | null {
  if (typeof value.date !== 'string') {
    return null;
  }
  const headline =
    typeof value.headline === 'string' && value.headline.trim()
      ? value.headline.trim()
      : `${value.date} 카카오뱅크 뉴스 브리핑`;
  return {
    date: value.date,
    headline,
    summary:
      typeof value.summary === 'string' ? alignEditorialSummary(headline, value.summary, 3) : '',
    topicTags: Array.isArray(value.topicTags)
      ? value.topicTags
          .filter((tag): tag is string => typeof tag === 'string')
          .map(getTopicDisplayName)
          .slice(0, 3)
      : [],
    publishedAt: typeof value.publishedAt === 'string' ? value.publishedAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    qualityScore: normalizeOptionalRatio(value.qualityScore),
    relevantArticleRatio: normalizeOptionalRatio(value.relevantArticleRatio),
    representativeArticleCount: normalizeOptionalCount(value.representativeArticleCount),
    uniqueSourceCount: normalizeOptionalCount(value.uniqueSourceCount),
  };
}

function isArchiveItem(value: BriefingArchiveItem | null): value is BriefingArchiveItem {
  return value !== null;
}

function sortItems(items: BriefingArchiveItem[]) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

function mergeByDate(
  primary: BriefingArchiveItem[],
  compatibility: BriefingArchiveItem[],
): BriefingArchiveItem[] {
  const items = new Map<string, BriefingArchiveItem>();
  for (const item of compatibility) {
    items.set(item.date, item);
  }
  for (const item of primary) {
    items.set(item.date, item);
  }
  return [...items.values()];
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

function recentMonths(count: number): Array<{ year: number; month: number }> {
  const current = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  });
  const parts = formatter.formatToParts(current);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);

  return Array.from({ length: count }, (_, index) => {
    const zeroBased = year * 12 + month - 1 - index;
    return {
      year: Math.floor(zeroBased / 12),
      month: (zeroBased % 12) + 1,
    };
  });
}

function normalizeOptionalRatio(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : undefined;
}

function normalizeOptionalCount(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : undefined;
}
