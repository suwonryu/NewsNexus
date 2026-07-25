import {
  getTopicConfidence,
  getTopicDisplayName,
  normalizeEditorialText,
  TOPIC_RULES,
} from './contentQuality';

const KABANG_API_ROOT =
  process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';

export interface NewsTopic {
  slug: string;
  title: string;
  description: string;
  trendSummary: string;
  briefings: Array<{
    date: string;
    headline: string;
    issueTitle: string;
    issueSummary: string;
    classificationConfidence: number;
  }>;
}

export async function getPublishedTopics(): Promise<NewsTopic[]> {
  try {
    const response = await fetch(`${KABANG_API_ROOT}/topics`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return [];
    }
    const values = (await response.json()) as unknown;
    return Array.isArray(values)
      ? values.map(normalizeTopic).filter(isTopic).filter(isPublishedTopic)
      : [];
  } catch {
    return [];
  }
}

export async function getTopic(slug: string): Promise<NewsTopic | null> {
  try {
    const response = await fetch(`${KABANG_API_ROOT}/topics/${encodeURIComponent(slug)}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return null;
    }
    const topic = normalizeTopic((await response.json()) as unknown);
    return topic && isPublishedTopic(topic) ? topic : null;
  } catch {
    return null;
  }
}

function normalizeTopic(value: unknown): NewsTopic | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<NewsTopic>;
  if (typeof raw.slug !== 'string' || typeof raw.title !== 'string') {
    return null;
  }
  const rule = TOPIC_RULES[raw.slug as keyof typeof TOPIC_RULES];
  if (!rule) {
    return null;
  }
  const rawBriefings: unknown[] = Array.isArray(raw.briefings) ? raw.briefings : [];
  const briefings = rawBriefings.length > 0
    ? rawBriefings
        .filter(isIncomingTopicBriefing)
        .map((item) => {
          const classificationConfidence = getTopicConfidence(
            raw.slug!,
            `${item.issueTitle} ${item.issueSummary}`,
          );
          return {
            ...item,
            issueSummary: normalizeEditorialText(item.issueSummary, 3),
            classificationConfidence,
          };
        })
        .filter((item) => item.classificationConfidence >= rule.minimumConfidence)
        .sort((left, right) => right.date.localeCompare(left.date))
    : [];
  return {
    slug: raw.slug,
    title: getTopicDisplayName(raw.slug),
    description: typeof raw.description === 'string' ? raw.description : '',
    trendSummary:
      briefings.length > 0
        ? buildTrendSummary(briefings)
        : typeof raw.trendSummary === 'string'
          ? normalizeEditorialText(raw.trendSummary, 2)
          : '',
    briefings,
  };
}

function isTopic(value: NewsTopic | null): value is NewsTopic {
  return value !== null;
}

function isPublishedTopic(value: NewsTopic): boolean {
  return value.description.trim().length >= 200 && value.briefings.length >= 3;
}

function isIncomingTopicBriefing(
  item: unknown,
): item is {
  date: string;
  headline: string;
  issueTitle: string;
  issueSummary: string;
} {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const value = item as Record<string, unknown>;
  return (
    typeof value.date === 'string' &&
    typeof value.headline === 'string' &&
    typeof value.issueTitle === 'string' &&
    typeof value.issueSummary === 'string'
  );
}

function buildTrendSummary(briefings: NewsTopic['briefings']): string {
  const titles = briefings.slice(0, 3).map((briefing) => briefing.issueTitle);
  if (titles.length === 0) {
    return '';
  }
  return `최근에는 ${titles.join(' → ')} 순으로 관련 흐름이 이어졌습니다.`;
}
