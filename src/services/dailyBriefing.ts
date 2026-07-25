import type { ArticleListItem } from '../types/article';
import { getKoreaIsoDate } from '../lib/koreaDate';

export interface DailyBriefingArticle {
  id: number | null;
  title: string;
  link: string;
  sourceName: string;
}

export interface DailyBriefingKeywordDetail {
  keyword: string;
  description: string;
}

export interface DailyBriefingSentimentSummary {
  positiveCount: number;
  negativeCount: number;
  unrelatedCount: number;
}

export interface DailyBriefingEditorialAnalysis {
  keyChanges: string[];
  changeFromPreviousDay: string | null;
  kakaoBankImpact: string | null;
  sourcePerspective: string | null;
  watchPoint: string | null;
}

export interface DailyBriefing {
  date: string;
  summary: string;
  articleCount: number;
  sourceCount: number;
  keywords: string[];
  headlines: string[];
  sourceNames: string[];
}

export interface DailyBriefingResponse {
  date: string;
  status: 'READY' | 'PREPARING' | 'NOT_FOUND';
  summary: string | null;
  articleCount: number;
  sourceCount: number;
  keywords: string[];
  keywordDetails?: DailyBriefingKeywordDetail[];
  sourceNames: string[];
  featuredArticles: DailyBriefingArticle[];
  sentimentSummary: DailyBriefingSentimentSummary;
  generatedAt: string | null;
  editorialAnalysis: DailyBriefingEditorialAnalysis | null;
  qualityScore?: number;
  relevantArticleRatio?: number;
  representativeArticleCount?: number;
  uniqueSourceCount?: number;
}

const STOPWORDS = new Set([
  '카카오뱅크',
  '오늘의',
  '기사',
  '주요',
  '대한',
  '관련',
  '정리',
  '발표',
  '브리핑',
  '요약',
  '뉴스',
  '속보',
]);

export function buildDailyBriefing(
  date: string,
  articles: ArticleListItem[],
): DailyBriefing | null {
  if (!date || articles.length === 0) {
    return null;
  }

  const sourceNames = [...new Set(articles.map((article) => article.sourceName))];
  const keywords = extractKeywords(articles);
  const headlines = articles.slice(0, 5).map((article) => article.title);
  const summaryParts = [
    `${date}에는 총 ${articles.length}건의 기사와 ${sourceNames.length}개 출처가 포착됐습니다.`,
    keywords.length > 0
      ? `${keywords.slice(0, 3).join(', ')} 같은 키워드가 반복적으로 나타나며, 아래 대표 기사를 따라가면 하루 흐름을 빠르게 이해할 수 있습니다.`
      : '대표 기사와 출처 분포를 따라가며 하루 흐름을 빠르게 파악할 수 있습니다.',
  ];

  return {
    date,
    summary: summaryParts.join(' '),
    articleCount: articles.length,
    sourceCount: sourceNames.length,
    keywords: keywords.length > 0 ? keywords.slice(0, 6) : ['전체 흐름', '대표 기사', '출처 비교'],
    headlines,
    sourceNames: sourceNames.slice(0, 12),
  };
}

export function buildFallbackDailyBriefingResponse(
  date: string,
  articles: ArticleListItem[],
): DailyBriefingResponse {
  if (isCurrentIsoDate(date)) {
    return {
      date,
      status: 'PREPARING',
      summary: null,
      articleCount: 0,
      sourceCount: 0,
      keywords: [],
      keywordDetails: [],
      sourceNames: [],
      featuredArticles: [],
      sentimentSummary: createEmptySentimentSummary(),
      generatedAt: null,
      editorialAnalysis: null,
    };
  }

  const briefing = buildDailyBriefing(date, articles);

  if (!briefing) {
    return {
      date,
      status: 'NOT_FOUND',
      summary: null,
      articleCount: 0,
      sourceCount: 0,
      keywords: [],
      keywordDetails: [],
      sourceNames: [],
      featuredArticles: [],
      sentimentSummary: createEmptySentimentSummary(),
      generatedAt: null,
      editorialAnalysis: null,
    };
  }

  return {
    date,
    status: 'READY',
    summary: briefing.summary,
    articleCount: briefing.articleCount,
    sourceCount: briefing.sourceCount,
    keywords: briefing.keywords,
    keywordDetails: [],
    sourceNames: briefing.sourceNames,
    featuredArticles: articles.slice(0, 6).map((article) => ({
      id: article.id,
      title: article.title,
      link: article.link,
      sourceName: article.sourceName,
    })),
    sentimentSummary: createEmptySentimentSummary(),
    generatedAt: new Date().toISOString(),
    editorialAnalysis: null,
  };
}

export function createEmptySentimentSummary(): DailyBriefingSentimentSummary {
  return {
    positiveCount: 0,
    negativeCount: 0,
    unrelatedCount: 0,
  };
}

function isCurrentIsoDate(date: string): boolean {
  return date === getKoreaIsoDate();
}

function extractKeywords(articles: ArticleListItem[]): string[] {
  const counts = new Map<string, number>();

  for (const article of articles) {
    for (const token of tokenize(article.title)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0], 'ko');
    })
    .slice(0, 6)
    .map(([keyword]) => keyword);
}

function tokenize(title: string): string[] {
  return title
    .split(/[^0-9A-Za-z가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !STOPWORDS.has(token));
}
