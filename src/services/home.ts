import { getKoreaIsoDate } from '../lib/koreaDate';
import type { ArticleListItem } from '../types/article';
import { normalizeEditorialText } from './contentPresentation';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';
const HOME_REVALIDATE_SECONDS = 60;

export type HomeBriefingStatus = 'READY' | 'PREPARING';
export type BankImpact = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
export type ImpactHorizon = 'SHORT' | 'MEDIUM' | 'LONG';

export interface HomeBriefingSummary {
  date: string;
  displayHeadline: string;
  displaySummary: string;
  topicTags: string[];
  updatedAt: string;
}

export interface HomeIssueClusterArticle {
  id: number | null;
  title: string;
  link: string;
  sourceName: string;
}

export interface HomeIssueCluster {
  id: string;
  title: string;
  summary: string;
  bankImpact: BankImpact | null;
  impactConfidence: number;
  impactHorizon: ImpactHorizon | null;
  impactDimensions: string[];
  impactReason: string;
  articleCount: number;
  sourceCount: number;
  representativeArticleId: number | null;
  topicSlug: string | null;
  articles: HomeIssueClusterArticle[];
  editorialPriority: number;
  priorityBreakdown?: {
    relevanceScore: number;
    impactScore: number;
    sourceReliability: number;
    coverageWeight: number;
  };
}

export interface HomeData {
  recentArticles: ArticleListItem[];
  today: string;
  todayStatus: HomeBriefingStatus;
  latestReadyBriefing: HomeBriefingSummary | null;
  topClusters: HomeIssueCluster[];
  watchNext: string[];
  collection: {
    articleCount: number;
    lastCollectedAt: string | null;
  };
}

export interface IssuePage {
  date: string;
  relevance: 'DIRECT' | 'INDUSTRY';
  offset: number;
  size: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: HomeIssueCluster[];
}

export async function getHomeData(): Promise<HomeData> {
  try {
    const response = await fetch(`${KABANG_API_ROOT}/home`, {
      next: { revalidate: HOME_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`Home API failed: ${response.status}`);
    }
    return normalizeHomeData((await response.json()) as Partial<HomeData>);
  } catch {
    return normalizeHomeData({});
  }
}

export async function getIssues(
  date: string,
  relevance: 'DIRECT' | 'INDUSTRY' = 'DIRECT',
): Promise<IssuePage> {
  try {
    const params = new URLSearchParams({ date, relevance, size: '20' });
    const response = await fetch(`${KABANG_API_ROOT}/issues?${params.toString()}`, {
      next: { revalidate: HOME_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`Issues API failed: ${response.status}`);
    }
    const raw = (await response.json()) as Partial<IssuePage>;
    const items = Array.isArray(raw.items)
      ? raw.items.map(normalizeCluster).filter((item): item is HomeIssueCluster => item !== null)
      : [];
    return {
      date,
      relevance,
      offset: normalizeCount(raw.offset),
      size: normalizeCount(raw.size) || 20,
      hasNext: raw.hasNext === true,
      nextCursor: typeof raw.nextCursor === 'string' ? raw.nextCursor : null,
      items,
    };
  } catch {
    return {
      date,
      relevance,
      offset: 0,
      size: 20,
      hasNext: false,
      nextCursor: null,
      items: [],
    };
  }
}

function normalizeHomeData(raw: Partial<HomeData>): HomeData {
  const today = typeof raw.today === 'string' ? raw.today : getKoreaIsoDate();
  return {
    today,
    recentArticles: normalizeClusterArticles(raw.recentArticles).map((article) => ({
      ...article, publishedDate: today,
    })),
    todayStatus: raw.todayStatus === 'READY' ? 'READY' : 'PREPARING',
    latestReadyBriefing: normalizeBriefing(raw.latestReadyBriefing),
    topClusters: Array.isArray(raw.topClusters)
      ? raw.topClusters.map(normalizeCluster).filter((item): item is HomeIssueCluster => item !== null)
      : [],
    watchNext: normalizeStrings(raw.watchNext).slice(0, 3),
    collection: {
      articleCount: normalizeCount(raw.collection?.articleCount),
      lastCollectedAt:
        typeof raw.collection?.lastCollectedAt === 'string'
          ? raw.collection.lastCollectedAt
          : null,
    },
  };
}

function normalizeBriefing(value: HomeData['latestReadyBriefing'] | undefined) {
  if (!value || typeof value.date !== 'string' || typeof value.displaySummary !== 'string') {
    return null;
  }
  const displayHeadline = normalizeText(value.displayHeadline);
  const displaySummary = normalizeEditorialText(value.displaySummary, 3);
  if (!displayHeadline || !displaySummary) {
    return null;
  }
  return {
    date: value.date,
    displayHeadline,
    displaySummary,
    topicTags: normalizeStrings(value.topicTags).slice(0, 5),
    updatedAt: normalizeText(value.updatedAt) || `${value.date}T00:00:00+09:00`,
  };
}

function normalizeCluster(value: HomeIssueCluster): HomeIssueCluster | null {
  if (!value || typeof value.id !== 'string' || typeof value.title !== 'string') {
    return null;
  }
  const impactValues: BankImpact[] = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'];
  const horizonValues: ImpactHorizon[] = ['SHORT', 'MEDIUM', 'LONG'];
  return {
    id: value.id,
    title: value.title,
    summary: normalizeText(value.summary),
    bankImpact: impactValues.includes(value.bankImpact as BankImpact) ? value.bankImpact : null,
    impactConfidence:
      typeof value.impactConfidence === 'number' ? value.impactConfidence : 0,
    impactHorizon: horizonValues.includes(value.impactHorizon as ImpactHorizon)
      ? value.impactHorizon
      : null,
    impactDimensions: normalizeStrings(value.impactDimensions),
    impactReason: normalizeText(value.impactReason) || '영향 분석을 준비하고 있습니다.',
    articleCount: normalizeCount(value.articleCount),
    sourceCount: normalizeCount(value.sourceCount),
    representativeArticleId:
      typeof value.representativeArticleId === 'number' ? value.representativeArticleId : null,
    topicSlug: typeof value.topicSlug === 'string' ? value.topicSlug : null,
    articles: normalizeClusterArticles(value.articles),
    editorialPriority:
      typeof value.editorialPriority === 'number' ? value.editorialPriority : 0,
    priorityBreakdown: normalizePriorityBreakdown(value.priorityBreakdown),
  };
}

function normalizeClusterArticles(value: unknown): HomeIssueClusterArticle[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      id: typeof item.id === 'number' ? item.id : null,
      title: normalizeText(item.title),
      link: normalizeText(item.link),
      sourceName: normalizeText(item.sourceName) || 'unknown',
    }))
    .filter((item) => item.title.length > 0 && item.link.length > 0);
}

function normalizePriorityBreakdown(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  return {
    relevanceScore: normalizeScore(raw.relevanceScore),
    impactScore: normalizeScore(raw.impactScore),
    sourceReliability: normalizeScore(raw.sourceReliability),
    coverageWeight: normalizeScore(raw.coverageWeight),
  };
}

function normalizeStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && value > 0 ? Math.floor(value) : 0;
}

function normalizeScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
}
