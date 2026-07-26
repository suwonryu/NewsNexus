const LOW_VALUE_PATTERNS = [
  /퀴즈\s*정답/i,
  /캐시워크/i,
  /오퀴즈/i,
  /앱테크/i,
  /경품\s*(?:안내|이벤트)/i,
  /이벤트\s*(?:정답|안내)/i,
  /제휴\s*콘텐츠/i,
  /ADVERTORIAL/i,
];

const DIRECT_BANK_PATTERN = /카카오\s*뱅크|카카오뱅크|카뱅/i;
const BANK_INDUSTRY_PATTERN = /인터넷\s*(?:전문)?은행|인뱅|은행권|금융당국|금융위|금감원/i;

export const TOPIC_RULES = {
  earnings: {
    title: '실적·수익성',
    requiredAny: ['실적', '순이익', '영업이익', '이자이익', '비이자', '수익성', 'NIM', '충전이익'],
    strongPhrases: ['실적 발표', '분기 순이익', '역대 최대 실적'],
    excludedContext: ['퀴즈', '경품', '예방교육'],
    minimumConfidence: 0.75,
  },
  'shareholder-return': {
    title: '주주환원',
    requiredAny: ['배당', '자사주', '주주환원', '소각', '주주가치', '총주주수익률'],
    strongPhrases: ['자사주 소각', '주주환원 정책'],
    excludedContext: ['퀴즈', '경품'],
    minimumConfidence: 0.75,
  },
  loans: {
    title: '대출·건전성',
    requiredAny: ['대출', '연체율', '건전성', '여신', '차주', '담보', '중저신용', '대환'],
    strongPhrases: ['공동대출', '대환대출', '개인사업자 대출'],
    excludedContext: ['퀴즈', '경품', '예방교육'],
    minimumConfidence: 0.75,
  },
  'ai-tech': {
    title: 'AI·기술',
    requiredAny: ['AI', '인공지능', '기술', '보안', '인증', '플랫폼', '앱', '전산', '장애'],
    strongPhrases: ['AI 서비스', '보안 사고', '서비스 장애', '인공지능 도입'],
    excludedContext: ['퀴즈 정답', '이모지 퀴즈', '경품', '캐시워크'],
    minimumConfidence: 0.75,
  },
  labor: {
    title: '노사·인력',
    requiredAny: [
      '노조', '파업', '임금', '인력', '채용', '노사', '노동', '성과급', '고용',
      '임단협', '쟁의', '단체협약',
    ],
    strongPhrases: [
      '전면 파업', '전면파업', '임금 교섭', '노사 협상', '인력 채용',
      '피켓 시위', '쟁의권', '임단협', '단체행동',
    ],
    excludedContext: [
      '가상자산', '자금세탁', '예금상품', '스테이블코인', '퀴즈',
      '소상공인 지원', '특례보증', '채용 지원금', '일자리 창출',
    ],
    minimumConfidence: 0.75,
  },
  global: {
    title: '해외사업·제휴',
    requiredAny: ['해외', '글로벌', '진출', '협력', '제휴', 'MOU', '몽골', '동남아'],
    strongPhrases: ['해외 진출', '글로벌 사업', '업무협약'],
    excludedContext: ['퀴즈', '경품'],
    minimumConfidence: 0.75,
  },
  regulation: {
    title: '규제',
    requiredAny: ['규제', '금융당국', '금융위', '금감원', '제재', '인가', '감독', '정책'],
    strongPhrases: ['금융당국 제재', '금융위원회 의결', '규제 완화'],
    excludedContext: ['퀴즈', '경품', '단순 이벤트'],
    minimumConfidence: 0.75,
  },
  operations: {
    title: '운영 안정성',
    requiredAny: ['장애', '서비스', '중단', '업무연속성', '보안', '사고', '복구', '안정'],
    strongPhrases: ['서비스 장애', '업무 연속성', '비상 대응'],
    excludedContext: ['퀴즈', '경품', '이벤트'],
    minimumConfidence: 0.75,
  },
} as const;

export type TopicSlug = keyof typeof TOPIC_RULES;

export interface BriefingQualityInput {
  headline: string;
  summary: string;
  articleCount?: number;
  unrelatedArticleCount?: number;
  relevantArticleRatio?: number;
  representativeArticleCount?: number;
  uniqueSourceCount?: number;
  qualityScore?: number;
}

export interface BriefingQualityResult {
  passes: boolean;
  qualityScore: number;
  relevantArticleRatio: number;
  representativeArticleCount: number;
  uniqueSourceCount: number;
  reasons: string[];
}

export function isLowValueContent(text: string): boolean {
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(text));
}

export function normalizeEditorialText(value: string | null | undefined, maxSentences = 3): string {
  if (!value) {
    return '';
  }

  const normalized = value
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/(?:^|\s+)-\s+(?=[가-힣A-Za-z0-9"'‘“])/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const parts = normalized
    .split(/\n+/)
    .flatMap((part) => splitSentences(part))
    .map((part) => part.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

  return parts
    .slice(0, maxSentences)
    .map(ensureSentenceEnding)
    .join(' ');
}

export function getTopicDisplayName(slugOrLabel: string): string {
  const normalized = slugOrLabel.toLowerCase() as TopicSlug;
  return TOPIC_RULES[normalized]?.title ?? formatEnumLabel(slugOrLabel);
}

export function getTopicConfidence(slug: string, title: string, summary = ''): number {
  const rule = TOPIC_RULES[slug as TopicSlug];
  const text = `${title} ${summary}`.trim();
  if (!rule || !text.trim()) {
    return 0;
  }

  const normalized = text.toLowerCase();
  if (rule.excludedContext.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return 0;
  }

  if (slug === 'labor' && !hasCoherentLaborContext(title, summary)) {
    return 0;
  }

  const matched = rule.requiredAny.filter((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
  const hasStrongPhrase = rule.strongPhrases.some((phrase) =>
    normalized.includes(phrase.toLowerCase()),
  );

  if (matched.length < 2 && !hasStrongPhrase) {
    return 0;
  }

  const bankContext = DIRECT_BANK_PATTERN.test(text) || BANK_INDUSTRY_PATTERN.test(text);
  const score =
    0.55 +
    Math.min(0.28, matched.length * 0.1) +
    (hasStrongPhrase ? 0.12 : 0) +
    (bankContext ? 0.08 : 0);

  return roundScore(Math.min(1, score));
}

export function evaluateBriefingQuality(input: BriefingQualityInput): BriefingQualityResult {
  const normalizedSummary = normalizeEditorialText(input.summary, 12);
  const sentences = splitSentences(normalizedSummary);
  const inferredRelevantRatio =
    sentences.length > 0
      ? sentences.filter((sentence) => isRelevantSentence(sentence)).length / sentences.length
      : 0;
  const relevantArticleRatio =
    normalizeRatio(input.relevantArticleRatio) ??
    (input.articleCount && input.articleCount > 0 && input.unrelatedArticleCount !== undefined
      ? Math.max(0, (input.articleCount - input.unrelatedArticleCount) / input.articleCount)
      : inferredRelevantRatio);
  const representativeArticleCount = Math.max(0, input.representativeArticleCount ?? 0);
  const uniqueSourceCount = Math.max(0, input.uniqueSourceCount ?? 0);
  const headlineScore =
    input.headline.trim().length >= 12 && !isLowValueContent(input.headline) ? 1 : 0;
  const summaryScore = sentences.length >= 2 && sentences.length <= 12 ? 1 : sentences.length > 0 ? 0.6 : 0;
  const inferredQualityScore =
    relevantArticleRatio * 0.55 +
    headlineScore * 0.2 +
    summaryScore * 0.15 +
    (uniqueSourceCount >= 2 || uniqueSourceCount === 0 ? 1 : 0.4) * 0.1;
  const qualityScore = normalizeRatio(input.qualityScore) ?? inferredQualityScore;
  const hasExplicitCoverage =
    input.representativeArticleCount !== undefined || input.uniqueSourceCount !== undefined;
  const reasons: string[] = [];

  if (qualityScore < 0.75) {
    reasons.push('qualityScore 기준 미달');
  }
  if (relevantArticleRatio < 0.7) {
    reasons.push('관련 기사 비율 기준 미달');
  }
  if (hasExplicitCoverage && representativeArticleCount < 3) {
    reasons.push('대표 기사 수 기준 미달');
  }
  if (hasExplicitCoverage && uniqueSourceCount < 2) {
    reasons.push('고유 출처 수 기준 미달');
  }
  if (isLowValueContent(`${input.headline} ${input.summary}`)) {
    reasons.push('퀴즈·경품·제휴성 콘텐츠');
  }

  return {
    passes: reasons.length === 0,
    qualityScore: roundScore(qualityScore),
    relevantArticleRatio: roundScore(relevantArticleRatio),
    representativeArticleCount,
    uniqueSourceCount,
    reasons,
  };
}

function isRelevantSentence(sentence: string): boolean {
  if (isLowValueContent(sentence)) {
    return false;
  }
  return DIRECT_BANK_PATTERN.test(sentence) || BANK_INDUSTRY_PATTERN.test(sentence);
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?。])\s+(?=[가-힣A-Z0-9"'‘“])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function hasCoherentLaborContext(title: string, summary: string): boolean {
  const normalizedTitle = title.toLowerCase();
  const normalizedSummary = summary.toLowerCase();
  const coreSignals = [
    '노조', '파업', '임금', '노사', '노동', '성과급', '임단협', '쟁의', '단체협약',
  ];
  const staffingSignals = ['인력', '채용', '고용'];
  const titleCoreCount = coreSignals.filter((signal) => normalizedTitle.includes(signal)).length;
  const summaryHasCore = coreSignals.some((signal) => normalizedSummary.includes(signal));
  if (titleCoreCount > 0) {
    return summaryHasCore || titleCoreCount >= 2;
  }
  const titleHasStaffing = staffingSignals.some((signal) => normalizedTitle.includes(signal));
  return titleHasStaffing && (DIRECT_BANK_PATTERN.test(summary) || BANK_INDUSTRY_PATTERN.test(title));
}

function ensureSentenceEnding(value: string): string {
  return /[.!?。]$/.test(value) ? value : `${value}.`;
}

function formatEnumLabel(value: string): string {
  const labels: Record<string, string> = {
    REGULATION: '규제',
    OPERATIONS: '운영 안정성',
    REVENUE: '수익',
    COST: '비용',
    CREDIT_RISK: '신용 위험',
    BRAND: '브랜드',
    GROWTH: '성장',
  };
  return labels[value] ?? value;
}

function normalizeRatio(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : null;
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}
