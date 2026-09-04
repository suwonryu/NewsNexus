import type {
  ArticleDetail,
  ArticleImpactAnalysis,
  ArticleListResponse,
  IsoDate,
} from '../types/article';
import { getKoreaIsoDate, getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import { getMockArticleDetail, getMockArticlesByDate, getMockDateTree } from './mockArticleData';
import type {
  DailyBriefingSentimentSummary,
  DailyBriefingEditorialAnalysis,
  DailyBriefingKeywordDetail,
  DailyBriefingResponse,
} from './dailyBriefing';
import { buildFallbackDailyBriefingResponse, createEmptySentimentSummary } from './dailyBriefing';
import type { DateTreeResponse } from '../types/article';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';
const KABANG_ARTICLE_API_BASE = `${KABANG_API_ROOT}/new`;
const KABANG_BRIEFING_API_BASE = `${KABANG_API_ROOT}/briefings`;
const KABANG_ANALYSIS_API_BASE = `${KABANG_API_ROOT}/analysis/articles`;
const REVALIDATE_SECONDS = 300;

interface KabangListItem {
  id: number | null;
  title: string;
  link: string;
}

interface KabangListResponse {
  date: string;
  totalCount: number;
  uniqueCount: number;
  offset: number;
  size: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: KabangListItem[];
}

interface KabangDetailResponse {
  id: number;
  date?: string | null;
  offset?: number | null;
  cursor?: string | null;
  title: string;
  link: string;
  summary: string | null;
  sentiment: string | null;
  publishedDate?: string | null;
}

async function getJson<T>(
  url: string,
  init?: RequestInit & { next?: { revalidate: number } },
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getArticleDetail(id: number): Promise<ArticleDetail | null> {
  try {
    const [response, analysis] = await Promise.all([
      getJson<KabangDetailResponse>(`${KABANG_ARTICLE_API_BASE}/${id}`, {
        next: { revalidate: REVALIDATE_SECONDS },
      }),
      getOptionalArticleAnalysis(id),
    ]);
    return mapKabangDetailResponse(response, analysis);
  } catch {
    return getMockArticleDetail(id);
  }
}

export async function getArticlesByDate(
  date: IsoDate,
  cursor: string | null = null,
  size = 20,
): Promise<ArticleListResponse> {
  const normalizedDate = normalizeDateForApi(date);
  const params = new URLSearchParams({ date: normalizedDate, size: String(size) });

  if (cursor) {
    params.set('cursor', cursor);
  }

  try {
    const response = await getJson<KabangListResponse>(
      `${KABANG_ARTICLE_API_BASE}?${params.toString()}`,
      {
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    return mapKabangListResponse(response);
  } catch {
    return getMockArticlesByDate(date, cursor, size);
  }
}

export async function getDailyBriefing(
  date: IsoDate,
  { enqueue = true }: { enqueue?: boolean } = {},
): Promise<DailyBriefingResponse> {

  try {
    const response = await getJson<DailyBriefingResponse>(
      `${KABANG_BRIEFING_API_BASE}/${date}?enqueue=${enqueue}`,
      enqueue
        ? { cache: 'no-store', signal: AbortSignal.timeout(5_000) }
        : {
            next: { revalidate: REVALIDATE_SECONDS },
            signal: AbortSignal.timeout(5_000),
          },
    );

    return normalizeDailyBriefingResponse(response, date);
  } catch {
    return buildFallbackDailyBriefingResponse(date);
  }
}

export async function getDateTree(): Promise<DateTreeResponse> {
  return getMockDateTree();
}

export async function getRecentArticleIds(limit = 200): Promise<number[]> {
  return getArticleIdsForSitemap({ limit, maxDaysToScan: 31 });
}

interface SitemapArticleIdOptions {
  limit?: number;
  maxDaysToScan?: number;
  pageSize?: number;
  maxPagesPerDay?: number;
}

export async function getArticleIdsForSitemap(
  options: SitemapArticleIdOptions = {},
): Promise<number[]> {
  const ids: number[] = [];
  const seen = new Set<number>();
  const limit = options.limit ?? 200;
  const maxDaysToScan = options.maxDaysToScan ?? 31;
  const pageSize = options.pageSize ?? 50;
  const maxPagesPerDay = options.maxPagesPerDay ?? 10;

  for (let dayOffset = 0; dayOffset < maxDaysToScan && ids.length < limit; dayOffset += 1) {
    const targetDate = getKoreaIsoDateWithOffset(dayOffset);
    let cursor: string | null = null;
    let pageGuard = 0;

    do {
      const page = await getArticlesByDate(targetDate, cursor, pageSize);
      for (const item of page.items) {
        if (item.id === null || seen.has(item.id)) {
          continue;
        }

        seen.add(item.id);
        ids.push(item.id);

        if (ids.length >= limit) {
          break;
        }
      }

      cursor = page.nextCursor;
      pageGuard += 1;
    } while (cursor && ids.length < limit && pageGuard < maxPagesPerDay);
  }

  return ids;
}

function normalizeDateForApi(date: string): string {
  return date.replace(/-/g, '');
}

function formatDateForDisplay(date: string): IsoDate {
  if (/^\d{8}$/.test(date)) {
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  return date;
}

function getSourceName(link: string): string {
  try {
    return new URL(link).hostname;
  } catch {
    return 'unknown';
  }
}

function mapKabangListResponse(response: KabangListResponse): ArticleListResponse {
  const items = response.items.map((item) => ({
    id: item.id,
    title: item.title,
    link: item.link,
    publishedDate: formatDateForDisplay(response.date),
    sourceName: getSourceName(item.link),
  }));

  return {
    date: response.date,
    totalCount: response.totalCount,
    uniqueCount: response.uniqueCount,
    offset: response.offset,
    size: response.size,
    hasNext: response.hasNext,
    nextCursor: response.nextCursor,
    items,
  };
}

async function getOptionalArticleAnalysis(id: number): Promise<ArticleImpactAnalysis | null> {
  try {
    return await getJson<ArticleImpactAnalysis>(`${KABANG_ANALYSIS_API_BASE}/${id}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    return null;
  }
}

function mapKabangDetailResponse(
  response: KabangDetailResponse,
  analysis: ArticleImpactAnalysis | null = null,
): ArticleDetail {
  return {
    id: response.id,
    title: response.title,
    link: response.link,
    offset: typeof response.offset === 'number' ? response.offset : undefined,
    cursor: response.cursor ?? null,
    summary: response.summary,
    sentiment: response.sentiment,
    analysis,
    publishedDate: response.publishedDate
      ? formatDateForDisplay(response.publishedDate)
      : response.date
        ? formatDateForDisplay(response.date)
        : undefined,
  };
}

function normalizeDailyBriefingResponse(
  response: DailyBriefingResponse,
  requestedDate: IsoDate,
): DailyBriefingResponse {
  if (
    !response || response.date !== requestedDate ||
    !['READY', 'PREPARING', 'NOT_FOUND'].includes(response.status) ||
    (response.status === 'READY' && (typeof response.summary !== 'string' || !response.summary.trim()))
  ) {
    return buildFallbackDailyBriefingResponse(requestedDate);
  }
  return {
    date: response.date || requestedDate,
    status: response.status,
    summary: response.summary ?? null,
    articleCount: response.articleCount ?? 0,
    sourceCount: response.sourceCount ?? 0,
    keywords: response.keywords ?? [],
    keywordDetails: normalizeKeywordDetails(response.keywordDetails),
    sourceNames: response.sourceNames ?? [],
    featuredArticles: response.featuredArticles ?? [],
    sentimentSummary: normalizeSentimentSummary(response.sentimentSummary),
    generatedAt: response.generatedAt ?? null,
    editorialAnalysis: normalizeEditorialAnalysis(response.editorialAnalysis),
    qualityScore: normalizeOptionalRatio(response.qualityScore),
    relevantArticleRatio: normalizeOptionalRatio(response.relevantArticleRatio),
    representativeArticleCount:
      typeof response.representativeArticleCount === 'number'
        ? normalizeCount(response.representativeArticleCount)
        : undefined,
    uniqueSourceCount:
      typeof response.uniqueSourceCount === 'number'
        ? normalizeCount(response.uniqueSourceCount)
        : undefined,
  };
}

function isCurrentIsoDate(date: string): boolean {
  return date === getKoreaIsoDate();
}

function normalizeKeywordDetails(
  keywordDetails: DailyBriefingResponse['keywordDetails'],
): DailyBriefingKeywordDetail[] {
  if (!Array.isArray(keywordDetails)) {
    return [];
  }

  return keywordDetails.filter(
    (item): item is DailyBriefingKeywordDetail =>
      Boolean(item) &&
      typeof item.keyword === 'string' &&
      item.keyword.length > 0 &&
      typeof item.description === 'string' &&
      item.description.length > 0,
  );
}

function normalizeSentimentSummary(
  sentimentSummary: DailyBriefingResponse['sentimentSummary'] | undefined,
): DailyBriefingSentimentSummary {
  if (!sentimentSummary) {
    return createEmptySentimentSummary();
  }

  return {
    positiveCount: normalizeCount(sentimentSummary.positiveCount),
    negativeCount: normalizeCount(sentimentSummary.negativeCount),
    unrelatedCount: normalizeCount(sentimentSummary.unrelatedCount),
  };
}

function normalizeEditorialAnalysis(
  editorialAnalysis: DailyBriefingResponse['editorialAnalysis'] | undefined,
): DailyBriefingEditorialAnalysis | null {
  if (!editorialAnalysis) {
    return null;
  }

  const keyChanges = Array.isArray(editorialAnalysis.keyChanges)
    ? editorialAnalysis.keyChanges.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];
  const changeFromPreviousDay = normalizeOptionalText(editorialAnalysis.changeFromPreviousDay);
  const kakaoBankImpact = normalizeOptionalText(editorialAnalysis.kakaoBankImpact);
  const sourcePerspective = normalizeOptionalText(editorialAnalysis.sourcePerspective);
  const watchPoint = normalizeOptionalText(editorialAnalysis.watchPoint);

  if (
    keyChanges.length === 0 &&
    !changeFromPreviousDay &&
    !kakaoBankImpact &&
    !sourcePerspective &&
    !watchPoint
  ) {
    return null;
  }

  return {
    keyChanges,
    changeFromPreviousDay,
    kakaoBankImpact,
    sourcePerspective,
    watchPoint,
  };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeCount(value: number | undefined): number {
  return typeof value === 'number' && value > 0 ? value : 0;
}

function normalizeOptionalRatio(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : undefined;
}
