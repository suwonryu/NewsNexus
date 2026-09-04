import {
  getTopicDisplayName,
  normalizeEditorialText,
} from './contentPresentation';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';

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
    return sortItems(items);
  } catch {
    return [];
  }
}

export async function getAllReadyBriefings(
  { throwOnError = false }: { throwOnError?: boolean } = {},
): Promise<BriefingArchiveItem[]> {
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
  } catch (error) {
    if (throwOnError) throw error;
    return [];
  }
  return [];
}

function normalizeItem(value: Partial<BriefingArchiveItem>): BriefingArchiveItem | null {
  if (!value || typeof value.date !== 'string' || typeof value.headline !== 'string' || !value.headline.trim() || typeof value.summary !== 'string' || !value.summary.trim()) {
    return null;
  }
  return {
    date: value.date,
    headline: value.headline.trim(),
    summary:
      typeof value.summary === 'string' ? normalizeEditorialText(value.summary, 3) : '',
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
