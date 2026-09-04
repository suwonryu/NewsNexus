// Presentation only: text formatting and labels, never editorial decisions.
const TOPIC_LABELS: Record<string, string> = {
  earnings: '실적·수익성', 'shareholder-return': '주주환원', loans: '대출·건전성',
  'ai-tech': 'AI·기술', labor: '노사·인력', global: '해외사업·제휴',
  regulation: '규제', operations: '운영 안정성',
};

export function getTopicDisplayName(value: string): string {
  return TOPIC_LABELS[value.toLowerCase()] ?? formatEnumLabel(value);
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

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?。])\s+(?=[가-힣A-Z0-9"'‘“])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
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
