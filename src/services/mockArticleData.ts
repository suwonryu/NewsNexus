import type {
  ArticleDetail,
  ArticleListItem,
  ArticleListResponse,
  DateTreeResponse,
  IsoDate,
} from '../types/article';

const SOURCE_NAME = '오늘의 카카오뱅크';
const SOURCE_URL = 'https://example.com/mock-article';
const START_DATE = '2024-07-14';
const MOCK_ID_BASE = 1738886400000000;

const MOCK_ARTICLES_BY_DATE: Record<IsoDate, ArticleDetail[]> = {
  '2026-02-07': Array.from({ length: 26 }, (_, idx) => {
    const number = idx + 1;
    return {
      id: MOCK_ID_BASE + number,
      title: `2026-02-07 주요 기사 ${number}`,
      link: `${SOURCE_URL}/${number}`,
      summary: `${number}번째 목 기사 요약입니다. 백엔드 연결 전 UI 흐름 검증을 위한 데이터입니다.`,
      sentiment: number % 3 === 0 ? 'NEGATIVE' : number % 2 === 0 ? 'NEUTRAL' : 'POSITIVE',
    };
  }),
  '2026-02-06': [
    {
      id: 1738800000000001,
      title: '2026-02-06 경제 동향',
      link: `${SOURCE_URL}/economy`,
      summary: '국내외 경제 지표 변화에 대한 요약입니다.',
      sentiment: 'NEUTRAL',
    },
    {
      id: 1738800000000002,
      title: '2026-02-06 기술 트렌드',
      link: `${SOURCE_URL}/tech`,
      summary: 'AI 제품화와 개발 생산성 도구의 최신 트렌드입니다.',
      sentiment: 'POSITIVE',
    },
  ],
  '2025-12-24': [
    {
      id: 1734998400000001,
      title: '2025-12-24 연말 특집',
      link: `${SOURCE_URL}/year-end`,
      summary: '연말 주요 이슈를 정리한 특집 기사입니다.',
      sentiment: 'NEUTRAL',
    },
  ],
  '2025-10-03': [
    {
      id: 1759449600000001,
      title: '2025-10-03 정책 브리핑',
      link: `${SOURCE_URL}/policy`,
      summary: '정책 발표 내용을 핵심만 정리했습니다.',
      sentiment: 'NEGATIVE',
    },
  ],
};

export function getMockDateTree(): DateTreeResponse {
  const yearsMap = new Map<number, Map<number, IsoDate[]>>();
  const start = new Date(`${START_DATE}T00:00:00`);
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const isoDate = formatIsoLocalDate(current);
    const [yearText, monthText] = isoDate.split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!yearsMap.has(year)) {
      yearsMap.set(year, new Map<number, IsoDate[]>());
    }

    const monthsMap = yearsMap.get(year)!;
    if (!monthsMap.has(month)) {
      monthsMap.set(month, []);
    }

    monthsMap.get(month)!.push(isoDate);
  }

  const years = Array.from(yearsMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, monthMap]) => ({
      year,
      months: Array.from(monthMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, days]) => ({
          month,
          days: days.sort((a, b) => (a < b ? 1 : -1)),
        })),
    }));

  return { years };
}

function formatIsoLocalDate(date: Date): IsoDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMockArticlesByDate(
  date: IsoDate,
  cursor: string | null,
  limit: number,
): ArticleListResponse {
  const allItems = (MOCK_ARTICLES_BY_DATE[date] ?? []).map<ArticleListItem>((article) => ({
    id: article.id,
    title: article.title,
    link: article.link,
    publishedDate: date,
    sourceName: SOURCE_NAME,
  }));

  const offset = cursor ? Number(cursor) : 0;
  const pageItems = allItems.slice(offset, offset + limit);
  const nextOffset = offset + pageItems.length;
  const nextCursor = nextOffset < allItems.length ? String(nextOffset) : null;

  return {
    date: date.replace(/-/g, ''),
    totalCount: allItems.length,
    uniqueCount: allItems.length,
    offset,
    size: limit,
    hasNext: nextCursor !== null,
    items: pageItems,
    nextCursor,
  };
}

export function getMockArticleDetail(id: number): ArticleDetail | null {
  for (const [date, articles] of Object.entries(MOCK_ARTICLES_BY_DATE)) {
    const target = articles.find((article) => article.id === id);
    if (target) {
      return {
        ...target,
        publishedDate: date,
      };
    }
  }

  return null;
}
