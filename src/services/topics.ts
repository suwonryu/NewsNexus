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
    return Array.isArray(values) ? values.map(normalizeTopic).filter(isTopic) : [];
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
    return normalizeTopic((await response.json()) as unknown);
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
  return {
    slug: raw.slug,
    title: raw.title,
    description: typeof raw.description === 'string' ? raw.description : '',
    trendSummary: typeof raw.trendSummary === 'string' ? raw.trendSummary : '',
    briefings: Array.isArray(raw.briefings)
      ? raw.briefings.filter(
          (item): item is NewsTopic['briefings'][number] =>
            Boolean(item) &&
            typeof item.date === 'string' &&
            typeof item.headline === 'string' &&
            typeof item.issueTitle === 'string' &&
            typeof item.issueSummary === 'string',
        )
      : [],
  };
}

function isTopic(value: NewsTopic | null): value is NewsTopic {
  return value !== null;
}
