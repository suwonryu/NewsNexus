import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import App from '../../../src/App';
import { getKoreaIsoDate } from '../../../src/lib/koreaDate';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
} from '../../../src/lib/siteMetadata';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import { evaluateArticleIndexEligibility } from '../../../src/services/contentQuality';
import type { ArticleDetail, ArticleListItem, IsoDate } from '../../../src/types/article';
import {
  getArticleDetail,
  getArticlesByDate,
  getDailyBriefing,
  getDateTree,
} from '../../../src/services/articleServerApi';

const ARTICLE_LIST_PAGE_SIZE = 20;

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_DESCRIPTION = '오늘의 카카오뱅크 기사 요약 페이지';

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const parsedId = Number(id);
  const siteUrl = getSiteUrl();
  const invalidCanonical = `${siteUrl}/news/${id}`;

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return {
      title: '기사를 찾을 수 없습니다',
      description: DEFAULT_DESCRIPTION,
      alternates: {
        canonical: invalidCanonical,
      },
      openGraph: buildArticleOpenGraph({
        title: '기사를 찾을 수 없습니다',
        description: DEFAULT_DESCRIPTION,
        canonical: invalidCanonical,
      }),
      twitter: buildTwitterMetadata('기사를 찾을 수 없습니다', DEFAULT_DESCRIPTION),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const article = await getArticleDetail(parsedId);

  if (!article) {
    return {
      title: '기사를 찾을 수 없습니다',
      description: DEFAULT_DESCRIPTION,
      alternates: {
        canonical: `${siteUrl}/news/${parsedId}`,
      },
      openGraph: buildArticleOpenGraph({
        title: '기사를 찾을 수 없습니다',
        description: DEFAULT_DESCRIPTION,
        canonical: `${siteUrl}/news/${parsedId}`,
      }),
      twitter: buildTwitterMetadata('기사를 찾을 수 없습니다', DEFAULT_DESCRIPTION),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = getDescription(article.summary);
  const canonical = `${siteUrl}/news/${parsedId}`;
  const eligibility = await getArticleIndexEligibility(article);
  const summaryTitle = eligibility.passes
    ? `${article.title} | 카카오뱅크 영향 분석`
    : `${article.title} | 요약`;

  return {
    title: summaryTitle,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: eligibility.passes,
      follow: true,
    },
    openGraph: {
      ...buildArticleOpenGraph({
        title: summaryTitle,
        description,
        canonical,
      }),
    },
    twitter: buildTwitterMetadata(summaryTitle, description),
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    notFound();
  }

  const article = await getArticleDetail(parsedId);

  if (!article) {
    notFound();
  }

  const selectedDate = getArticleIsoDate(article, getKoreaIsoDate());
  const [response, dateTree] = await Promise.all([
    getArticlesForInitialRender(selectedDate, article),
    getDateTree(),
  ]);
  const initialArticles = ensureArticleInList(
    response.items,
    createListItemFromDetail(article, selectedDate),
  );
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/news/${parsedId}`;
  const eligibility = await getArticleIndexEligibility(article);
  const pageName = eligibility.passes
    ? `${article.title} | 카카오뱅크 영향 분석`
    : `${article.title} 요약`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageName,
    description: getDescription(article.summary),
    url: canonical,
    inLanguage: 'ko',
    mainEntity: {
      '@type': 'Article',
      headline: pageName,
      abstract: article.summary,
      datePublished: article.publishedDate ?? selectedDate,
      dateModified: article.publishedDate ?? selectedDate,
      author: {
        '@type': 'Organization',
        name: '오늘의 카카오뱅크',
      },
      publisher: {
        '@type': 'Organization',
        name: '오늘의 카카오뱅크',
      },
      about: article.analysis?.matchedEntities.map((name) => ({
        '@type': 'Thing',
        name,
      })),
      citation: article.link,
      isBasedOn: article.link,
      url: canonical,
    },
    isBasedOn: article.link,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <App
        initialArticleId={parsedId}
        initialArticleDetail={article}
        initialSelectedDate={selectedDate}
        initialDateTree={dateTree.years}
        initialArticles={initialArticles}
        initialNextCursor={response.nextCursor}
        initialHasMore={response.hasMore}
      />
    </>
  );
}

function getDescription(summary: string | null): string {
  if (!summary) {
    return DEFAULT_DESCRIPTION;
  }

  const normalized = summary.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return DEFAULT_DESCRIPTION;
  }

  return normalized.slice(0, 160);
}

async function getArticleIndexEligibility(article: ArticleDetail) {
  const publishedDate = normalizeToIsoDate(article.publishedDate);
  if (!publishedDate) {
    return evaluateArticleIndexEligibility({
      ...article,
      isEditorialRepresentative: false,
    });
  }

  const briefing = await getDailyBriefing(publishedDate, { enqueue: false });
  const isEditorialRepresentative =
    briefing.status === 'READY' &&
    briefing.featuredArticles.some((candidate) => candidate.id === article.id);

  return evaluateArticleIndexEligibility({
    ...article,
    isEditorialRepresentative,
  });
}

function buildArticleOpenGraph({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical: string;
}): NonNullable<Metadata['openGraph']> {
  return {
    title,
    description,
    url: canonical,
    type: 'article',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    images: [DEFAULT_OG_IMAGE],
  };
}

function buildTwitterMetadata(
  title: string,
  description: string,
): NonNullable<Metadata['twitter']> {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [DEFAULT_OG_IMAGE_PATH],
  };
}

function normalizeToIsoDate(date: string | undefined): string | null {
  if (!date) {
    return null;
  }

  if (/^\d{8}$/.test(date)) {
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  return null;
}

function inferIsoDateFromArticleId(id: number): string | null {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  try {
    const milliseconds = Number(BigInt(id) / 1000n);
    const timestamp = new Date(milliseconds);

    if (Number.isNaN(timestamp.getTime())) {
      return null;
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(timestamp);
  } catch {
    return null;
  }
}

function getArticleIsoDate(article: ArticleDetail, fallbackDate: string): string {
  return (
    normalizeToIsoDate(article.publishedDate) ??
    inferIsoDateFromArticleId(article.id) ??
    fallbackDate
  );
}

function getArticleKey(article: Pick<ArticleListItem, 'id' | 'link'>): string {
  return `${article.id ?? 'null'}:${article.link}`;
}

function getSourceName(link: string): string {
  try {
    return new URL(link).hostname;
  } catch {
    return 'unknown';
  }
}

function createListItemFromDetail(article: ArticleDetail, fallbackDate: string): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    link: article.link,
    publishedDate: getArticleIsoDate(article, fallbackDate),
    sourceName: getSourceName(article.link),
  };
}

function ensureArticleInList(
  items: ArticleListItem[],
  selectedArticle: ArticleListItem,
): ArticleListItem[] {
  const selectedArticleKey = getArticleKey(selectedArticle);

  if (items.some((item) => getArticleKey(item) === selectedArticleKey)) {
    return items;
  }

  return [selectedArticle, ...items];
}

async function getArticlesForInitialRender(
  date: IsoDate,
  article: ArticleDetail,
): Promise<{
  items: ArticleListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  if (typeof article.offset !== 'number' || article.offset < 0) {
    const response = await getArticlesByDate(date, null, ARTICLE_LIST_PAGE_SIZE);
    return {
      items: response.items,
      nextCursor: response.nextCursor,
      hasMore: response.hasNext,
    };
  }

  let cursor: string | null = null;
  let aggregatedItems: ArticleListItem[] = [];
  let nextCursor: string | null = null;
  let hasMore = false;

  do {
    const response = await getArticlesByDate(date, cursor, ARTICLE_LIST_PAGE_SIZE);
    aggregatedItems = [...aggregatedItems, ...response.items];
    nextCursor = response.nextCursor;
    hasMore = response.hasNext;

    if (aggregatedItems.length > article.offset || !response.nextCursor) {
      break;
    }

    cursor = response.nextCursor;
  } while (cursor);

  return {
    items: aggregatedItems,
    nextCursor,
    hasMore,
  };
}
