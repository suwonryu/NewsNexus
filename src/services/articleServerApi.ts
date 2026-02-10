import type { ArticleDetail, ArticleListResponse, IsoDate } from '../types/article';
import { getMockArticleDetail, getMockArticlesByDate } from './mockArticleData';

const KABANG_API_BASE = 'https://fury.kabang.app/v2/kabang/new';
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
  title: string;
  link: string;
  summary: string | null;
  sentiment: string | null;
  date?: string | null;
  publishedDate?: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getArticleDetail(id: number): Promise<ArticleDetail | null> {
  try {
    const response = await getJson<KabangDetailResponse>(`${KABANG_API_BASE}/${id}`);
    return mapKabangDetailResponse(response);
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
    const response = await getJson<KabangListResponse>(`${KABANG_API_BASE}?${params.toString()}`);
    return mapKabangListResponse(response);
  } catch {
    return getMockArticlesByDate(date, cursor, size);
  }
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
    const targetDate = getIsoDateWithOffset(dayOffset);
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

function mapKabangDetailResponse(response: KabangDetailResponse): ArticleDetail {
  return {
    id: response.id,
    title: response.title,
    link: response.link,
    summary: response.summary,
    sentiment: response.sentiment,
    publishedDate: response.publishedDate
      ? formatDateForDisplay(response.publishedDate)
      : response.date
        ? formatDateForDisplay(response.date)
        : undefined,
  };
}

function getIsoDateWithOffset(dayOffset: number): IsoDate {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
