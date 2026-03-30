'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import MainMenu from './components/MainMenu';
import SubMenu from './components/SubMenu';
import MainContent from './components/MainContent';
import {
  fetchArticleDetail,
  fetchArticlesByDate,
  fetchDateTree,
} from './services/articleApi';
import type { ArticleDetail, ArticleListItem, DateTreeYear, IsoDate } from './types/article';

const ARTICLE_LIST_PAGE_SIZE = 20;

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBriefingHref(date: string | null): string {
  return `/briefing/${date ?? getTodayIsoDate()}`;
}

function isCurrentIsoDate(date: string | null): boolean {
  return date === getTodayIsoDate();
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

function dedupeArticles(items: ArticleListItem[]): ArticleListItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getArticleKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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
  const dedupedItems = dedupeArticles(items);
  const selectedArticleKey = getArticleKey(selectedArticle);

  if (dedupedItems.some((item) => getArticleKey(item) === selectedArticleKey)) {
    return dedupedItems;
  }

  return [selectedArticle, ...dedupedItems];
}

function shouldRestoreArticlePosition(
  article: ArticleDetail | null,
  selectedArticleId: number | null,
  selectedDate: string | null,
): article is ArticleDetail & { offset: number } {
  return (
    article !== null &&
    article.id === selectedArticleId &&
    selectedDate !== null &&
    typeof article.offset === 'number' &&
    article.offset >= 0 &&
    getArticleIsoDate(article, selectedDate) === selectedDate
  );
}

async function fetchArticlesThroughOffset(
  date: IsoDate,
  offset: number,
): Promise<{
  items: ArticleListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  let cursor: string | null = null;
  let aggregatedItems: ArticleListItem[] = [];
  let nextCursor: string | null = null;
  let hasMore = false;

  do {
    const response = await fetchArticlesByDate(date, cursor, ARTICLE_LIST_PAGE_SIZE);
    aggregatedItems = dedupeArticles([...aggregatedItems, ...response.items]);
    nextCursor = response.nextCursor;
    hasMore = response.hasNext;

    if (aggregatedItems.length > offset || !response.nextCursor) {
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

interface AppProps {
  initialArticleId?: number | null;
  initialArticleDetail?: ArticleDetail | null;
  initialSelectedDate?: string | null;
  initialArticles?: ArticleListItem[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
}

function App({
  initialArticleId = null,
  initialArticleDetail = null,
  initialSelectedDate = null,
  initialArticles = [],
  initialNextCursor = null,
  initialHasMore = false,
}: AppProps) {
  const consumedServerInitialListRef = useRef(false);
  const [dateTree, setDateTree] = useState<DateTreeYear[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    () =>
      initialSelectedDate ??
      normalizeToIsoDate(initialArticleDetail?.publishedDate) ??
      getTodayIsoDate(),
  );
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(initialArticleId);
  const [selectedArticleKey, setSelectedArticleKey] = useState<string | null>(null);
  const [pendingArticle, setPendingArticle] = useState<ArticleListItem | null>(null);
  const [articles, setArticles] = useState<ArticleListItem[]>(initialArticles);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(initialArticleDetail);
  const [isDetailLoading, setIsDetailLoading] = useState(
    initialArticleId !== null && initialArticleDetail === null,
  );
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(() =>
    initialArticleId !== null ? 'detail' : 'list',
  );

  useEffect(() => {
    const nextSelectedDate =
      initialSelectedDate ?? normalizeToIsoDate(initialArticleDetail?.publishedDate);
    if (nextSelectedDate) {
      setSelectedDate(nextSelectedDate);
    }

    setSelectedArticleId(initialArticleId);
    if (initialArticleDetail) {
      setSelectedArticleKey(getArticleKey(initialArticleDetail));
    } else {
      setSelectedArticleKey(null);
    }
    setPendingArticle(null);
    setArticleDetail(initialArticleDetail);
    setIsDetailLoading(initialArticleId !== null && initialArticleDetail === null);
    if (initialArticleId !== null) {
      setMobileView('detail');
    }
  }, [initialArticleId, initialArticleDetail, initialSelectedDate]);

  useEffect(() => {
    let disposed = false;

    const loadDateTree = async () => {
      try {
        const response = await fetchDateTree();
        if (!disposed) {
          setDateTree(response.years);
        }
      } catch {
        if (!disposed) {
          setDateTree([]);
        }
      }
    };

    void loadDateTree();
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    if (!selectedDate) {
      setArticles([]);
      setNextCursor(null);
      setHasMore(false);
      setIsListLoading(false);
      return () => {
        disposed = true;
      };
    }

    if (
      !consumedServerInitialListRef.current &&
      initialSelectedDate &&
      selectedDate === initialSelectedDate
    ) {
      consumedServerInitialListRef.current = true;
      setIsListLoading(false);
      return () => {
        disposed = true;
      };
    }

    const loadArticles = async () => {
      setIsListLoading(true);
      try {
        const listResponse = await fetchArticlesByDate(selectedDate, null, ARTICLE_LIST_PAGE_SIZE);
        const response = {
          items: listResponse.items,
          nextCursor: listResponse.nextCursor,
          hasMore: listResponse.hasNext,
        };

        if (disposed) {
          return;
        }

        setArticles(dedupeArticles(response.items));
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch {
        if (!disposed) {
          setArticles([]);
          setNextCursor(null);
          setHasMore(false);
        }
      } finally {
        if (!disposed) {
          setIsListLoading(false);
          setIsFetchingMore(false);
        }
      }
    };

    void loadArticles();
    return () => {
      disposed = true;
    };
  }, [initialSelectedDate, selectedDate]);

  useEffect(() => {
    let disposed = false;

    if (!shouldRestoreArticlePosition(articleDetail, selectedArticleId, selectedDate)) {
      return () => {
        disposed = true;
      };
    }

    const selectedArticleKey = getArticleKey(articleDetail);
    if (articles.some((item) => getArticleKey(item) === selectedArticleKey)) {
      return () => {
        disposed = true;
      };
    }

    const restoreDate = selectedDate;
    if (!restoreDate) {
      return () => {
        disposed = true;
      };
    }

    const restoreArticlePosition = async () => {
      setIsListLoading(true);
      try {
        const response = await fetchArticlesThroughOffset(restoreDate, articleDetail.offset);
        if (disposed) {
          return;
        }

        setArticles(response.items);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch {
        if (!disposed) {
          setHasMore(false);
        }
      } finally {
        if (!disposed) {
          setIsListLoading(false);
          setIsFetchingMore(false);
        }
      }
    };

    void restoreArticlePosition();
    return () => {
      disposed = true;
    };
  }, [articleDetail, articles, selectedArticleId, selectedDate]);

  useEffect(() => {
    let disposed = false;

    if (selectedArticleId === null) {
      setArticleDetail(null);
      setIsDetailLoading(false);
      return () => {
        disposed = true;
      };
    }

    if (articleDetail?.id === selectedArticleId) {
      setIsDetailLoading(false);
      setPendingArticle(null);
      return () => {
        disposed = true;
      };
    }

    const loadArticleDetail = async () => {
      setIsDetailLoading(true);
      try {
        const response = await fetchArticleDetail(selectedArticleId);
        if (!disposed) {
          setArticleDetail(response);
          setPendingArticle(null);
        }
      } catch {
        if (!disposed) {
          setArticleDetail(null);
          setPendingArticle(null);
        }
      } finally {
        if (!disposed) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadArticleDetail();
    return () => {
      disposed = true;
    };
  }, [selectedArticleId, articleDetail]);

  useEffect(() => {
    if (!articleDetail || articleDetail.id !== selectedArticleId) {
      return;
    }

    const articleDate = getArticleIsoDate(
      articleDetail,
      selectedDate ?? initialSelectedDate ?? getTodayIsoDate(),
    );
    if (selectedDate !== articleDate) {
      setSelectedDate(articleDate);
      return;
    }

    const selectedArticle = createListItemFromDetail(
      articleDetail,
      selectedDate ?? initialSelectedDate ?? getTodayIsoDate(),
    );

    setSelectedArticleKey(getArticleKey(selectedArticle));
    if (typeof articleDetail.offset !== 'number') {
      setArticles((prev) => ensureArticleInList(prev, selectedArticle));
    }
  }, [articleDetail, initialSelectedDate, selectedArticleId, selectedDate]);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const matched = currentPath.match(/^\/news\/(\d+)$/);

      if (!matched) {
        setSelectedArticleId(null);
        setPendingArticle(null);
        setSelectedArticleKey(null);
        setArticleDetail(null);
        setIsDetailLoading(false);
        setMobileView('list');
        return;
      }

      const parsedId = Number(matched[1]);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return;
      }

      setPendingArticle(null);
      setSelectedArticleKey(null);
      setSelectedArticleId(parsedId);
      setIsDetailLoading(true);
      setMobileView('detail');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSelectDate = (date: string) => {
    if (date === selectedDate) {
      return;
    }

    posthog.capture('date_selected', { date });
    setSelectedDate(date);
    setSelectedArticleId(null);
    setSelectedArticleKey(null);
    setPendingArticle(null);
    setArticleDetail(null);
    setArticles([]);
    setNextCursor(null);
    setHasMore(false);
    setIsFetchingMore(false);
    setMobileView('list');
    setIsDateSheetOpen(false);

    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSelectArticle = (article: ArticleListItem) => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const articleKey = getArticleKey(article);
    if (articleKey === selectedArticleKey) {
      if (isMobile) {
        setMobileView('detail');
      }
      return;
    }

    posthog.capture('article_selected', {
      article_id: article.id,
      title: article.title,
      source: article.sourceName,
    });
    setSelectedArticleKey(articleKey);

    if (article.id === null) {
      if (selectedDate !== getTodayIsoDate()) {
        return;
      }

      setSelectedArticleId(null);
      setPendingArticle(article);
      setArticleDetail(null);
      setIsDetailLoading(false);
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    } else {
      if (isMobile) {
        setPendingArticle(article);
      } else {
        setPendingArticle(null);
      }
      if (isMobile) {
        setArticleDetail(null);
      }
      setIsDetailLoading(true);
      setSelectedArticleId(article.id);
      const targetPath = `/news/${article.id}`;
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }

    if (isMobile) {
      setMobileView('detail');
    }
  };

  const handleShowArticleList = useCallback(() => {
    posthog.capture('mobile_article_list_opened');
    setMobileView('list');

    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!selectedDate || !nextCursor || isListLoading || isFetchingMore) {
      return;
    }

    posthog.capture('article_list_load_more', { date: selectedDate });
    setIsFetchingMore(true);
    try {
      const response = await fetchArticlesByDate(selectedDate, nextCursor);
      setArticles((prev) => dedupeArticles([...prev, ...response.items]));
      setNextCursor(response.nextCursor);
      setHasMore(response.hasNext);
    } catch {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [selectedDate, nextCursor, isListLoading, isFetchingMore]);

  useEffect(() => {
    if (!isDateSheetOpen) {
      return undefined;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDateSheetOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [isDateSheetOpen]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="md:hidden h-[calc(100vh-2rem)] flex flex-col gap-3">
        <header className="rounded-2xl border border-white/60 bg-white/85 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">오늘의 카카오뱅크</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h1 className="text-lg font-[650] text-slate-900">
              {mobileView === 'list' ? '기사 목록' : '기사 보기'}
            </h1>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <a
                  href={getBriefingHref(selectedDate)}
                  onClick={() => posthog.capture('briefing_link_clicked', { date: selectedDate })}
                  className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100"
                >
                  {isCurrentIsoDate(selectedDate) ? '브리핑 준비 중' : '브리핑 보기'}
                </a>
              )}
              <button
                type="button"
                onClick={() => { posthog.capture('mobile_date_sheet_opened'); setIsDateSheetOpen(true); }}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
              >
                {selectedDate ?? '날짜 선택'}
              </button>
            </div>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              mobileView === 'list'
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : '-translate-x-8 opacity-0 pointer-events-none'
            }`}
          >
            <SubMenu
              className="h-full"
              selectedDate={selectedDate}
              items={articles}
              selectedArticleKey={selectedArticleKey}
              isLoading={isListLoading || isFetchingMore}
              hasMore={hasMore}
              onSelectArticle={handleSelectArticle}
              onLoadMore={handleLoadMore}
            />
          </div>

          <div
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              mobileView === 'detail'
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : 'translate-x-8 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex h-full flex-col gap-2">
              <button
                type="button"
                onClick={handleShowArticleList}
                className="self-start rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
              >
                목록으로
              </button>
              <MainContent
                className="h-full"
                selectedDate={selectedDate}
                selectedArticleId={selectedArticleId}
                pendingArticle={pendingArticle}
                articleDetail={articleDetail}
                isLoading={isDetailLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 hidden items-center justify-between md:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Overview</p>
          <h1 className="mt-1 text-2xl font-[700] tracking-[-0.03em] text-slate-950">
            기사 탐색
          </h1>
        </div>
        {selectedDate && (
          <a
            href={getBriefingHref(selectedDate)}
            onClick={() => posthog.capture('briefing_link_clicked', { date: selectedDate })}
            className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 shadow-[0_8px_18px_rgba(6,182,212,0.12)] hover:border-cyan-400 hover:bg-cyan-100"
          >
            {isCurrentIsoDate(selectedDate)
              ? `${selectedDate} 브리핑 준비 중`
              : `${selectedDate} 브리핑 보기`}
          </a>
        )}
      </div>

      <div className="hidden md:grid h-[calc(100vh-7rem)] grid-cols-[260px_360px_1fr] gap-3">
        <MainMenu
          dateTree={dateTree}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
        <SubMenu
          selectedDate={selectedDate}
          items={articles}
          selectedArticleKey={selectedArticleKey}
          isLoading={isListLoading || isFetchingMore}
          hasMore={hasMore}
          onSelectArticle={handleSelectArticle}
          onLoadMore={handleLoadMore}
        />
        <MainContent
          selectedDate={selectedDate}
          selectedArticleId={selectedArticleId}
          pendingArticle={pendingArticle}
          articleDetail={articleDetail}
          isLoading={isDetailLoading}
        />
      </div>

      <div
        className={`fixed inset-0 z-50 md:hidden transition-[visibility] duration-300 ${
          isDateSheetOpen ? 'visible' : 'invisible'
        }`}
      >
        <button
          type="button"
          aria-label="날짜 메뉴 닫기"
          onClick={() => setIsDateSheetOpen(false)}
          className={`absolute inset-0 backdrop-blur-[1px] transition-opacity duration-300 ${
            isDateSheetOpen
              ? 'bg-slate-900/40 opacity-100 pointer-events-auto'
              : 'bg-slate-900/0 opacity-0 pointer-events-none'
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[78vh] rounded-t-3xl border-t border-white/60 bg-white px-5 pb-6 pt-4 shadow-[0_-20px_40px_rgba(15,23,42,0.2)] transition-transform duration-300 ease-out ${
            isDateSheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-[650] text-slate-900">날짜 선택</h2>
            <button
              type="button"
              onClick={() => setIsDateSheetOpen(false)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
            >
              닫기
            </button>
          </div>
          <MainMenu
            dateTree={dateTree}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            showHeader={false}
            className="h-[calc(78vh-96px)] border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
