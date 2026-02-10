import type {
  ArticleDetail,
  ArticleListItem,
  ArticleListResponse,
  DateTreeResponse,
  IsoDate,
} from '../types/article';
import {
  getMockArticleDetail,
  getMockArticlesByDate,
  getMockDateTree,
} from './mockArticleData';

const API_BASE = '/api/articles';
const KABANG_API_BASE = 'https://fury.kabang.app/v2/kabang/new';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchDateTree(): Promise<DateTreeResponse> {
  try {
    return await getJson<DateTreeResponse>(`${API_BASE}/dates`);
  } catch {
    return getMockDateTree();
  }
}

export async function fetchArticlesByDate(
  date: IsoDate,
  cursor: string | null,
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

export async function fetchArticleDetail(id: number): Promise<ArticleDetail> {
  try {
    const response = await getJson<KabangDetailResponse>(`${KABANG_API_BASE}/${id}`);
    return mapKabangDetailResponse(response);
  } catch {
    const fallback = getMockArticleDetail(id);

    if (!fallback) {
      throw new Error('Article not found');
    }

    return fallback;
  }
}

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
  const items = response.items.map<ArticleListItem>((item) => ({
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
