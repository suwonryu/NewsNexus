import { getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import { getDailyBriefing } from './articleServerApi';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';

export interface BriefingArchiveItem {
  date: string;
  headline: string;
  summary: string;
  topicTags: string[];
  publishedAt: string | null;
  updatedAt: string | null;
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
    const items = responses.flat().map(normalizeItem).filter(isArchiveItem);
    if (items.length > 0) {
      return sortItems(items);
    }
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

async function buildCompatibilityArchive(): Promise<BriefingArchiveItem[]> {
  const items: BriefingArchiveItem[] = [];
  for (let dayOffset = 1; dayOffset <= 30; dayOffset += 1) {
    const date = getKoreaIsoDateWithOffset(dayOffset);
    const briefing = await getDailyBriefing(date, { enqueue: false });
    if (briefing.status !== 'READY' || !briefing.summary) {
      continue;
    }
    items.push({
      date,
      headline:
        briefing.editorialAnalysis?.keyChanges?.[0] ||
        briefing.keywords.slice(0, 3).join(' · ') ||
        `${date} 카카오뱅크 뉴스 브리핑`,
      summary: briefing.summary,
      topicTags: briefing.keywords.slice(0, 3),
      publishedAt: briefing.generatedAt,
      updatedAt: briefing.generatedAt,
    });
  }
  return sortItems(items);
}

function normalizeItem(value: Partial<BriefingArchiveItem>): BriefingArchiveItem | null {
  if (typeof value.date !== 'string') {
    return null;
  }
  return {
    date: value.date,
    headline:
      typeof value.headline === 'string' && value.headline.trim()
        ? value.headline.trim()
        : `${value.date} 카카오뱅크 뉴스 브리핑`,
    summary: typeof value.summary === 'string' ? value.summary.trim() : '',
    topicTags: Array.isArray(value.topicTags)
      ? value.topicTags.filter((tag): tag is string => typeof tag === 'string').slice(0, 3)
      : [],
    publishedAt: typeof value.publishedAt === 'string' ? value.publishedAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
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
