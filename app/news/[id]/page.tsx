import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import App from '../../../src/App';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import type { ArticleDetail, ArticleListItem, IsoDate } from '../../../src/types/article';
import { getArticleDetail, getArticlesByDate } from '../../../src/services/articleServerApi';

const ARTICLE_LIST_PAGE_SIZE = 20;

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_DESCRIPTION = '오늘의 카카오뱅크 기사 요약 페이지';

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const parsedId = Number(id);
  const siteUrl = getSiteUrl();

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return {
      title: '기사를 찾을 수 없습니다',
      description: DEFAULT_DESCRIPTION,
      alternates: {
        canonical: `${siteUrl}/news/${id}`,
      },
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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = getDescription(article.summary);
  const canonical = `${siteUrl}/news/${parsedId}`;
  const summaryTitle = `${article.title} | 요약`;

  return {
    title: summaryTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: summaryTitle,
      description,
      url: canonical,
      type: 'article',
      images: [
        {
          url: '/og-kabang-summary.svg',
          width: 1200,
          height: 630,
          alt: '오늘의 카카오뱅크',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: summaryTitle,
      description,
      images: ['/og-kabang-summary.svg'],
    },
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

  const selectedDate = getArticleIsoDate(article, getTodayIsoDate());
  const response = await getArticlesForInitialRender(selectedDate, article);
  const initialArticles = ensureArticleInList(
    response.items,
    createListItemFromDetail(article, selectedDate),
  );
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/news/${parsedId}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${article.title} 요약`,
    description: getDescription(article.summary),
    url: canonical,
    inLanguage: 'ko',
    mainEntity: {
      '@type': 'Article',
      headline: `${article.title} 요약`,
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

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
