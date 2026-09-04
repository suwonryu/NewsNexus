export type IsoDate = string;

export interface DateTreeMonth {
  month: number;
  days: IsoDate[];
}

export interface DateTreeYear {
  year: number;
  months: DateTreeMonth[];
}

export interface DateTreeResponse {
  years: DateTreeYear[];
}

export interface ArticleListItem {
  id: number | null;
  title: string;
  link: string;
  publishedDate: IsoDate;
  sourceName: string;
}

export interface ArticleListResponse {
  date: string;
  totalCount: number;
  uniqueCount: number;
  offset: number;
  size: number;
  hasNext: boolean;
  items: ArticleListItem[];
  nextCursor: string | null;
}

export interface ArticleDetail {
  id: number;
  title: string;
  link: string;
  publishedDate?: IsoDate;
  offset?: number;
  cursor?: string | null;
  summary: string | null;
  sentiment: string | null;
  analysis?: ArticleImpactAnalysis | null;
}

export interface ArticleImpactAnalysis {
  indexable?: boolean;
  sitemapEligible?: boolean;
  relevanceLevel: 'DIRECT' | 'INDUSTRY' | 'IRRELEVANT';
  relevanceConfidence: number;
  relevanceReason: string;
  matchedEntities: string[];
  editorialPriority?: number;
  coreEligible?: boolean;
  exclusionReason?: string | null;
  priorityBreakdown?: {
    relevanceScore: number;
    impactScore: number;
    sourceReliability: number;
    coverageWeight: number;
  };
  clusterId: string | null;
  clusterTitle: string | null;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' | null;
  impactConfidence: number;
  impactHorizon: 'SHORT' | 'MEDIUM' | 'LONG' | null;
  impactDimensions: string[];
  impactReason: string | null;
  evidenceArticleIds: number[];
  analysisVersion: string;
}
