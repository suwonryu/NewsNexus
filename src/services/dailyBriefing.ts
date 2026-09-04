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

// An unavailable API is not evidence of a completed or missing briefing.
export function buildFallbackDailyBriefingResponse(date: string): DailyBriefingResponse {
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

export function createEmptySentimentSummary(): DailyBriefingSentimentSummary {
  return { positiveCount: 0, negativeCount: 0, unrelatedCount: 0 };
}
