'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
const HISTORY_SELECTED_DATE_KEY = '__newsnexusSelectedDate';

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

function getSelectedDateFromHistory(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const state = window.history.state;
  if (!state || typeof state !== 'object') {
    return null;
  }

  return normalizeToIsoDate(
    HISTORY_SELECTED_DATE_KEY in state && typeof state[HISTORY_SELECTED_DATE_KEY] === 'string'
      ? state[HISTORY_SELECTED_DATE_KEY]
      : undefined,
  );
}

function updateHistoryEntry(
  mode: 'push' | 'replace',
  url: string,
  selectedDate: string | null,
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const currentState =
    window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
  const nextState = {
    ...currentState,
    [HISTORY_SELECTED_DATE_KEY]: selectedDate ?? getTodayIsoDate(),
  };

  if (mode === 'push') {
    window.history.pushState(nextState, '', url);
    return;
  }

  window.history.replaceState(nextState, '', url);
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
  initialDateTree?: DateTreeYear[];
  initialArticles?: ArticleListItem[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
}

function App({
  initialArticleId = null,
  initialArticleDetail = null,
  initialSelectedDate = null,
  initialDateTree = [],
  initialArticles = [],
  initialNextCursor = null,
  initialHasMore = false,
}: AppProps) {
  const consumedServerInitialListRef = useRef(false);
  const [dateTree, setDateTree] = useState<DateTreeYear[]>(initialDateTree);
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
    const historySelectedDate = getSelectedDateFromHistory();
    if (!historySelectedDate || historySelectedDate === selectedDate) {
      return;
    }

    setSelectedDate(historySelectedDate);
    setArticles([]);
    setNextCursor(null);
    setHasMore(false);
    setIsFetchingMore(false);
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedDate) {
      return;
    }

    const currentPath = window.location.pathname;
    if (currentPath !== '/' && !/^\/news\/\d+$/.test(currentPath)) {
      return;
    }

    const historySelectedDate = getSelectedDateFromHistory();
    if (currentPath === '/' && historySelectedDate && historySelectedDate !== selectedDate) {
      return;
    }

    if (historySelectedDate === selectedDate) {
      return;
    }

    updateHistoryEntry('replace', currentPath, selectedDate);
  }, [selectedArticleId, selectedDate]);

  useEffect(() => {
    if (initialDateTree.length > 0) {
      setDateTree(initialDateTree);
    }
  }, [initialDateTree]);

  useEffect(() => {
    let disposed = false;

    if (initialDateTree.length > 0) {
      return () => {
        disposed = true;
      };
    }

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
  }, [initialDateTree]);

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
      const nextSelectedDate = getSelectedDateFromHistory() ?? getTodayIsoDate();

      setSelectedDate((prevSelectedDate) =>
        prevSelectedDate === nextSelectedDate ? prevSelectedDate : nextSelectedDate,
      );

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

    if (typeof window !== 'undefined') {
      const articleExplorerPath = `/explore?view=articles&date=${date}`;
      if (window.location.pathname === '/explore') {
        updateHistoryEntry('replace', articleExplorerPath, date);
      } else {
        updateHistoryEntry('push', articleExplorerPath, date);
      }
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

    setSelectedArticleKey(articleKey);

    if (article.id === null) {
      if (selectedDate !== getTodayIsoDate()) {
        return;
      }

      setSelectedArticleId(null);
      setPendingArticle(article);
      setArticleDetail(null);
      setIsDetailLoading(false);
      if (typeof window !== 'undefined' && window.location.pathname !== '/explore') {
        updateHistoryEntry(
          'push',
          `/explore?view=articles&date=${selectedDate}`,
          selectedDate,
        );
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
        updateHistoryEntry('push', targetPath, selectedDate);
      }
    }

    if (isMobile) {
      setMobileView('detail');
    }
  };

  const handleShowArticleList = useCallback(() => {
    setMobileView('list');

    if (typeof window !== 'undefined' && window.location.pathname !== '/explore') {
      updateHistoryEntry(
        'push',
        `/explore?view=articles&date=${selectedDate ?? getTodayIsoDate()}`,
        selectedDate,
      );
    }
  }, [selectedDate]);

  const handleLoadMore = useCallback(async () => {
    if (!selectedDate || !nextCursor || isListLoading || isFetchingMore) {
      return;
    }

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
    <div className="mobile-app-shell mx-auto max-w-[1320px] md:min-h-screen md:px-8 md:pb-6 md:pt-5">
      <section className="my-3 rounded-[18px] border border-[#d2d2d7] bg-white/95 px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#0071e3] dark:text-[#2997ff]">탐색</p>
            <h1 className="mt-1 text-lg font-[680] text-slate-950 dark:text-white md:text-xl">
              {selectedArticleId !== null || pendingArticle
                ? '기사 상세'
                : '기사별 보기'}
            </h1>
          </div>
          <nav className="flex gap-2" aria-label="탐색 보기">
            <Link
              href={`/explore?date=${selectedDate ?? getTodayIsoDate()}`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
            >
              이슈별
            </Link>
            <span
              aria-current="page"
              className="rounded-full bg-[#0071e3] px-4 py-2 text-sm font-semibold text-white dark:bg-[#2997ff] dark:text-black"
            >
              기사별
            </span>
          </nav>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {selectedDate && (
              <Link
                href={getBriefingHref(selectedDate)}
                className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
              >
                {isCurrentIsoDate(selectedDate) ? '오늘 소식 정리 중' : '브리핑 보기'}
              </Link>
            )}
            <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 md:inline">
              {selectedDate}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsDateSheetOpen(true);
            }}
            className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#0071e3] hover:text-[#0066cc] dark:border-[#424245] dark:bg-[#272729] dark:text-slate-200 dark:hover:border-[#2997ff] dark:hover:text-[#2997ff] md:hidden"
          >
            {selectedDate ?? '날짜 선택'}
          </button>
        </div>
      </section>

      <div className="mobile-app-shell-body !min-h-[calc(100svh-15rem)] md:hidden flex min-h-0 flex-col gap-3">
        {mobileView === 'list' ? (
          <div className="transition-all duration-300 ease-out">
            <SubMenu
              selectedDate={selectedDate}
              items={articles}
              selectedArticleKey={selectedArticleKey}
              isLoading={isListLoading || isFetchingMore}
              hasMore={hasMore}
              onSelectArticle={handleSelectArticle}
              onLoadMore={handleLoadMore}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 transition-all duration-300 ease-out">
            <button
              type="button"
              onClick={handleShowArticleList}
              className="self-start rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-[#0071e3] hover:text-[#0066cc] dark:border-[#424245] dark:bg-[#272729] dark:text-slate-200 dark:hover:border-[#2997ff] dark:hover:text-[#2997ff]"
            >
              목록으로
            </button>
            <MainContent
              selectedDate={selectedDate}
              selectedArticleId={selectedArticleId}
              pendingArticle={pendingArticle}
              articleDetail={articleDetail}
              isLoading={isDetailLoading}
            />
          </div>
        )}
      </div>

      <div className="hidden min-h-[34rem] md:grid md:h-[calc(100vh-16rem)] md:grid-cols-[260px_360px_1fr] md:gap-3">
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
              ? 'bg-slate-900/40 opacity-100 pointer-events-auto dark:bg-slate-950/65'
              : 'bg-slate-900/0 opacity-0 pointer-events-none'
          }`}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[78dvh] rounded-t-[28px] border-t border-[#d2d2d7] bg-white px-5 pb-6 pt-4 shadow-[0_-20px_40px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_-20px_48px_rgba(0,0,0,0.5)] ${
            isDateSheetOpen ? 'translate-y-0' : 'translate-y-full'
          } mobile-bottom-sheet`}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-[650] text-slate-900 dark:text-slate-50">날짜 선택</h2>
            <button
              type="button"
              onClick={() => setIsDateSheetOpen(false)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              닫기
            </button>
          </div>
          <MainMenu
            dateTree={dateTree}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            showHeader={false}
            scrollMode="always"
            className="h-[calc(78dvh-96px)] border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
