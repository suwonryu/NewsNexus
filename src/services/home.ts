import { getKoreaIsoDate, getKoreaIsoDateWithOffset } from '../lib/koreaDate';
import type { ArticleListResponse } from '../types/article';
import { getArticlesByDate, getDailyBriefing } from './articleServerApi';
import { normalizeEditorialText } from './contentQuality';
import { buildDisplayHeadline, rankAndMergeIssues } from './editorialRanking';

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
  let home: HomeData;
  try {
    const response = await fetch(`${KABANG_API_ROOT}/home`, {
      next: { revalidate: HOME_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(`Home API failed: ${response.status}`);
    }
    home = normalizeHomeData((await response.json()) as Partial<HomeData>);
  } catch {
    home = await buildCompatibilityHomeData();
  }
  return enhanceHomeEditorialData(home);
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
    const articlePage = await safeGetArticles(date, 100);
    return {
      date,
      relevance,
      offset: normalizeCount(raw.offset),
      size: normalizeCount(raw.size) || 20,
      hasNext: raw.hasNext === true,
      nextCursor: typeof raw.nextCursor === 'string' ? raw.nextCursor : null,
      items: rankAndMergeIssues(items, articlePage.items),
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

async function buildCompatibilityHomeData(): Promise<HomeData> {
  const today = getKoreaIsoDate();
  const collection = await safeGetArticles(today);
  let latestReadyBriefing: HomeData['latestReadyBriefing'] = null;
  let topClusters: HomeIssueCluster[] = [];
  let watchNext: string[] = [];

  for (let dayOffset = 1; dayOffset <= 14; dayOffset += 1) {
    const date = getKoreaIsoDateWithOffset(dayOffset);
    const briefing = await getDailyBriefing(date, { enqueue: false });
    if (briefing.status !== 'READY' || !briefing.summary) {
      continue;
    }

    const topicTags = briefing.keywords.slice(0, 5);
    latestReadyBriefing = {
      date,
      displayHeadline:
        briefing.editorialAnalysis?.keyChanges?.[0] ??
        topicTags.slice(0, 3).join(' · ') ??
        `${date} 카카오뱅크 뉴스 브리핑`,
      displaySummary: normalizeEditorialText(briefing.summary, 3),
      topicTags,
      updatedAt: briefing.generatedAt ?? `${date}T00:00:00+09:00`,
    };
    topClusters = buildFallbackClusters(briefing);
    watchNext = briefing.editorialAnalysis?.watchPoint
      ? [briefing.editorialAnalysis.watchPoint]
      : [];
    break;
  }

  return {
    today,
    todayStatus: 'PREPARING',
    latestReadyBriefing,
    topClusters,
    watchNext,
    collection: {
      articleCount: collection.uniqueCount,
      lastCollectedAt: null,
    },
  };
}

function buildFallbackClusters(
  briefing: Awaited<ReturnType<typeof getDailyBriefing>>,
): HomeIssueCluster[] {
  const details = briefing.keywordDetails ?? [];
  const impactReason =
    briefing.editorialAnalysis?.kakaoBankImpact ??
    '기존 브리핑 데이터를 사용 중이며 이슈별 영향 근거를 재분석하고 있습니다.';

  return details.slice(0, 3).map((detail, index) => {
    const article = briefing.featuredArticles[index] ?? briefing.featuredArticles[0];
    return {
      id: `compat-${briefing.date}-${index}`,
      title: detail.keyword,
      summary: detail.description,
      bankImpact: briefing.editorialAnalysis?.kakaoBankImpact ? 'MIXED' : 'NEUTRAL',
      impactConfidence: 0,
      impactHorizon: null,
      impactDimensions: [],
      impactReason,
      articleCount: 1,
      sourceCount: article ? 1 : 0,
      representativeArticleId: article?.id ?? null,
      topicSlug: null,
      articles: article
        ? [
            {
              id: article.id,
              title: article.title,
              link: article.link,
              sourceName: article.sourceName,
            },
          ]
        : [],
      editorialPriority: 0,
    };
  });
}

async function enhanceHomeEditorialData(home: HomeData): Promise<HomeData> {
  const briefing = home.latestReadyBriefing;
  if (!briefing) {
    return home;
  }

  try {
    const [issues, articles, dailyBriefing] = await Promise.all([
      getIssues(briefing.date, 'DIRECT'),
      getArticlesByDate(briefing.date, null, 100),
      getDailyBriefing(briefing.date, { enqueue: false }),
    ]);
    const candidates = issues.items.length > 0 ? issues.items : home.topClusters;
    const topClusters = rankAndMergeIssues(candidates, articles.items);
    const summarySource =
      dailyBriefing.status === 'READY' && dailyBriefing.summary
        ? dailyBriefing.summary
        : briefing.displaySummary;
    const editorialLead =
      dailyBriefing.editorialAnalysis?.keyChanges?.[0] ?? briefing.displayHeadline;

    return {
      ...home,
      latestReadyBriefing: {
        ...briefing,
        displayHeadline: buildDisplayHeadline(topClusters, editorialLead),
        displaySummary: normalizeEditorialText(summarySource, 3),
        topicTags:
          dailyBriefing.status === 'READY'
            ? dailyBriefing.keywords.slice(0, 5)
            : briefing.topicTags,
        updatedAt:
          dailyBriefing.status === 'READY'
            ? dailyBriefing.generatedAt ?? briefing.updatedAt
            : briefing.updatedAt,
      },
      topClusters,
    };
  } catch {
    return {
      ...home,
      latestReadyBriefing: {
        ...briefing,
        displayHeadline: buildDisplayHeadline(home.topClusters, briefing.displayHeadline),
        displaySummary: normalizeEditorialText(briefing.displaySummary, 3),
      },
    };
  }
}

async function safeGetArticles(date: string, size = 20): Promise<ArticleListResponse> {
  try {
    return await getArticlesByDate(date, null, size);
  } catch {
    return {
      date,
      totalCount: 0,
      uniqueCount: 0,
      offset: 0,
      size,
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
  if (!value || typeof value.date !== 'string') {
    return null;
  }
  const legacy = value as HomeData['latestReadyBriefing'] & {
    headline?: string;
    summary?: string;
  };
  return {
    date: value.date,
    displayHeadline:
      normalizeText(value.displayHeadline) ||
      normalizeText(legacy.headline) ||
      `${value.date} 카카오뱅크 뉴스 브리핑`,
    displaySummary: normalizeEditorialText(
      normalizeText(value.displaySummary) || normalizeText(legacy.summary),
      3,
    ),
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
