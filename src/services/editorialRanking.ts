import type { ArticleListItem } from '../types/article';
import type { HomeIssueCluster, HomeIssueClusterArticle } from './home';
import { isLowValueContent, normalizeEditorialText } from './contentQuality';

interface PriorityBreakdown {
  relevanceScore: number;
  impactScore: number;
  sourceReliability: number;
  coverageWeight: number;
}

const EVENT_DEFINITIONS = [
  {
    key: 'labor-strike',
    pattern: /파업|쟁의|임금\s*교섭|성과급|노사\s*(?:갈등|협상)/i,
    title: '카카오뱅크 첫 전면파업 예고…보상 협상·서비스 안정 쟁점',
    headline: '첫 전면파업 예고로 노사 갈등·서비스 안정 부각',
  },
  {
    key: 'joint-loan',
    pattern: /공동\s*대출|기업\s*공동\s*대출/i,
    title: '카카오뱅크·지방은행 공동대출 추진…중소기업 자금 공급 확대',
    headline: '공동대출·포용금융 협력 확대',
  },
  {
    key: 'youth-prevention',
    pattern: /청소년.*(?:도박|금융\s*피해)|(?:도박|금융\s*피해).*청소년/i,
    title: '카카오뱅크, 청소년 불법도박·금융피해 예방교육 확대',
    headline: '청소년 금융피해 예방 강화',
  },
  {
    key: 'women-finance',
    pattern: /여성.*(?:보증|금융|기업)|(?:보증|금융).*여성/i,
    title: '카카오뱅크·세종시, 여성기업 성장금융 지원 확대',
    headline: '여성기업 금융지원 확대',
  },
  {
    key: 'stablecoin-circle',
    pattern: /스테이블\s*코인|디지털\s*자산.*(?:서클|협력)|서클.*디지털\s*자산/i,
    title: '카카오그룹·서클, 디지털자산 결제 인프라 협력',
    headline: '디지털자산 인프라 협력 진전',
  },
  {
    key: 'earnings',
    pattern: /실적\s*발표|순이익|영업이익|역대\s*최대\s*실적/i,
    title: '카카오뱅크 실적과 성과 배분 논의 부각',
    headline: '실적·성과 배분 쟁점 부각',
  },
] as const;

const HIGH_IMPACT_PATTERN =
  /파업|실적|순이익|영업이익|제재|대출|연체|금리|보안|장애|규제|인가|자본|서비스\s*중단/i;
const MEDIUM_IMPACT_PATTERN =
  /협력|제휴|지원|교육|사회공헌|캠페인|방문|수상|선정/i;
const DIRECT_BANK_PATTERN = /카카오\s*뱅크|카카오뱅크|카뱅/i;

export function rankAndMergeIssues(
  issues: HomeIssueCluster[],
  articles: ArticleListItem[],
): HomeIssueCluster[] {
  const articleById = new Map(
    articles
      .filter((article): article is ArticleListItem & { id: number } => article.id !== null)
      .map((article) => [article.id, article]),
  );
  const candidates = issues
    .filter((issue) => !isLowValueContent(`${issue.title} ${issue.summary}`))
    .filter((issue) => isDirectEnough(issue))
    .filter((issue) => isSummaryCoherent(issue.title, issue.summary))
    .map((issue) => enrichIssue(issue, articleById));
  const groups: HomeIssueCluster[][] = [];

  for (const candidate of candidates) {
    const group = groups.find((items) => shouldMerge(items[0], candidate));
    if (group) {
      group.push(candidate);
    } else {
      groups.push([candidate]);
    }
  }

  return groups
    .map(mergeGroup)
    .filter((issue) => issue.editorialPriority >= 0.16)
    .sort((left, right) => right.editorialPriority - left.editorialPriority);
}

export function buildDisplayHeadline(
  clusters: HomeIssueCluster[],
  fallback: string,
): string {
  const phrases = clusters
    .slice(0, 2)
    .map((cluster) => getEventDefinition(`${cluster.title} ${cluster.summary}`)?.headline)
    .filter((phrase): phrase is NonNullable<typeof phrase> => phrase !== undefined);

  if (phrases.length > 0) {
    return `카카오뱅크, ${[...new Set(phrases)].join('…')}`;
  }

  const normalizedFallback = normalizeEditorialText(fallback, 1)
    .replace(/[.!?]$/, '')
    .replace(/\.{3,}|…+$/g, '');
  return normalizedFallback || '카카오뱅크 주요 변화와 영향을 한눈에';
}

function enrichIssue(
  issue: HomeIssueCluster,
  articleById: Map<number, ArticleListItem>,
): HomeIssueCluster {
  const representative =
    issue.representativeArticleId !== null
      ? articleById.get(issue.representativeArticleId)
      : undefined;
  const issueArticles =
    issue.articles.length > 0
      ? issue.articles
      : representative
        ? [toClusterArticle(representative)]
        : [];
  const breakdown = calculatePriority(issue, representative?.sourceName, 1, 1);

  return {
    ...issue,
    summary: sanitizeIssueSummary(issue.title, issue.summary),
    editorialPriority: multiplyPriority(breakdown),
    priorityBreakdown: breakdown,
    articles: issueArticles,
  };
}

function mergeGroup(group: HomeIssueCluster[]): HomeIssueCluster {
  const articleMap = new Map<string, HomeIssueClusterArticle>();
  for (const issue of group) {
    for (const article of issue.articles) {
      articleMap.set(`${article.id ?? 'original'}:${article.link}`, article);
    }
  }
  const articles = [...articleMap.values()];
  const uniqueSources = new Set(
    articles.map((article) => normalizeSource(article.sourceName)).filter(Boolean),
  );
  const articleCount = Math.max(
    articles.length,
    group.reduce((total, issue) => total + Math.max(1, issue.articleCount), 0),
  );
  const sourceCount = Math.max(
    uniqueSources.size,
    group.reduce((total, issue) => total + Math.max(1, issue.sourceCount), 0),
  );
  const representative = [...group].sort(
    (left, right) =>
      (right.priorityBreakdown?.sourceReliability ?? 0) -
        (left.priorityBreakdown?.sourceReliability ?? 0) ||
      right.summary.length - left.summary.length,
  )[0];
  const event = getEventDefinition(group.map((issue) => `${issue.title} ${issue.summary}`).join(' '));
  const breakdown = calculatePriority(
    representative,
    representative.articles[0]?.sourceName,
    articleCount,
    sourceCount,
  );

  return {
    ...representative,
    id: group.length > 1 ? `merged-${event?.key ?? representative.id}` : representative.id,
    title: group.length > 1 && event ? event.title : representative.title,
    summary: normalizeEditorialText(representative.summary, 3),
    impactReason: buildImpactReason(representative, articleCount, sourceCount),
    impactConfidence: calibrateImpactConfidence(
      representative.impactConfidence,
      articleCount,
      sourceCount,
    ),
    articleCount,
    sourceCount,
    articles,
    editorialPriority: multiplyPriority(breakdown),
    priorityBreakdown: breakdown,
  };
}

function shouldMerge(left: HomeIssueCluster, right: HomeIssueCluster): boolean {
  const leftText = `${left.title} ${left.summary}`;
  const rightText = `${right.title} ${right.summary}`;
  const leftEvent = getEventDefinition(leftText);
  const rightEvent = getEventDefinition(rightText);

  if (leftEvent && rightEvent) {
    if (leftEvent.key !== rightEvent.key) {
      return false;
    }
    if (leftEvent.key === 'labor-strike') {
      return isKakaoBankSubject(left.title) && isKakaoBankSubject(right.title);
    }
    return true;
  }

  const leftTokens = tokenizeTitle(left.title);
  const rightTokens = tokenizeTitle(right.title);
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && intersection / union >= 0.58;
}

function calculatePriority(
  issue: HomeIssueCluster,
  sourceName: string | undefined,
  articleCount: number,
  sourceCount: number,
): PriorityBreakdown {
  const text = `${issue.title} ${issue.summary}`;
  const relevanceScore = isKakaoBankSubject(issue.title)
    ? 1
    : DIRECT_BANK_PATTERN.test(text)
      ? 0.78
      : /인터넷\s*(?:전문)?은행|인뱅/i.test(text)
        ? 0.58
        : 0.4;
  const impactScore = HIGH_IMPACT_PATTERN.test(text)
    ? 0.95
    : MEDIUM_IMPACT_PATTERN.test(text)
      ? 0.68
      : 0.6;
  const sourceReliability = getSourceReliability(sourceName);
  const coverageWeight = Math.min(
    1,
    0.55 + Math.max(0, articleCount - 1) * 0.12 + Math.max(0, sourceCount - 1) * 0.08,
  );

  return {
    relevanceScore,
    impactScore,
    sourceReliability,
    coverageWeight,
  };
}

function buildImpactReason(
  issue: HomeIssueCluster,
  articleCount: number,
  sourceCount: number,
): string {
  const normalized = normalizeEditorialText(issue.impactReason, 3)
    .replace(
      /^(?:\d+개 매체의 \d+건 보도를 (?:기준으로\s*|종합했습니다\.\s*))+/u,
      '',
    )
    .replace(/\s*주요 점검 영역은 .*?입니다\.?$/u, '')
    .trim();
  const reasonWithEvidence = normalized.includes('근거:')
    ? normalized
    : `${normalized} 근거: ${normalizeEditorialText(issue.summary, 1)}`;
  if (articleCount <= 1) {
    return reasonWithEvidence;
  }
  return `${sourceCount}개 매체의 ${articleCount}건 보도를 종합했습니다. ${reasonWithEvidence}`;
}

function isDirectEnough(issue: HomeIssueCluster): boolean {
  const text = `${issue.title} ${issue.summary}`;
  if (!DIRECT_BANK_PATTERN.test(text)) {
    return false;
  }
  if (/카카오페이증권|카카오엔터|카카오\s*본사/i.test(issue.title) && !isKakaoBankSubject(issue.title)) {
    return false;
  }
  return true;
}

function isSummaryCoherent(title: string, summary: string): boolean {
  const titleEvent = getEventDefinition(title);
  if (!titleEvent) {
    return sanitizeIssueSummary(title, summary).length > 0;
  }
  return titleEvent.pattern.test(summary);
}

function sanitizeIssueSummary(title: string, summary: string): string {
  const normalized = normalizeEditorialText(summary, 12);
  if (!normalized) {
    return '';
  }
  const titleEvent = getEventDefinition(title);
  const titleTokens = tokenizeTitle(title);
  const sentences = normalized.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const matching = sentences.filter((sentence) => {
    if (titleEvent) {
      return titleEvent.pattern.test(sentence);
    }
    if (DIRECT_BANK_PATTERN.test(sentence)) {
      return true;
    }
    const overlap = [...titleTokens].filter((token) => sentence.toLowerCase().includes(token)).length;
    return overlap >= Math.min(2, Math.max(1, titleTokens.size));
  });
  return matching.slice(0, 3).join(' ');
}

function calibrateImpactConfidence(
  reported: number,
  articleCount: number,
  sourceCount: number,
): number {
  if (reported <= 0) {
    return 0;
  }
  const evidenceCeiling = Math.min(
    0.84,
    0.56 + Math.max(0, sourceCount - 1) * 0.07 + Math.max(0, articleCount - 1) * 0.02,
  );
  return Math.round(Math.min(reported, evidenceCeiling) * 1000) / 1000;
}

function isKakaoBankSubject(title: string): boolean {
  return DIRECT_BANK_PATTERN.test(title);
}

function getEventDefinition(text: string) {
  return EVENT_DEFINITIONS.find((event) => event.pattern.test(text));
}

function getSourceReliability(sourceName: string | undefined): number {
  if (!sourceName) {
    return 0.68;
  }
  const source = normalizeSource(sourceName);
  if (
    /(?:hankyung|mk\.co|sedaily|mt\.co|heraldcorp|ajunews|newstomato|sisajournal|businessplus)/i.test(
      source,
    )
  ) {
    return 0.92;
  }
  if (/(?:gametoc|wikitree|pinpointnews)/i.test(source)) {
    return 0.55;
  }
  return 0.75;
}

function tokenizeTitle(title: string): Set<string> {
  return new Set(
    title
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length >= 2)
      .filter((token) => !['카카오뱅크', '카뱅', '은행', '금융'].includes(token)),
  );
}

function normalizeSource(value: string): string {
  return value.replace(/^www\./, '').toLowerCase();
}

function multiplyPriority(breakdown: PriorityBreakdown): number {
  const value =
    breakdown.relevanceScore *
    breakdown.impactScore *
    breakdown.sourceReliability *
    breakdown.coverageWeight;
  return Math.round(value * 1000) / 1000;
}

function toClusterArticle(article: ArticleListItem): HomeIssueClusterArticle {
  return {
    id: article.id,
    title: article.title,
    link: article.link,
    sourceName: article.sourceName,
  };
}
