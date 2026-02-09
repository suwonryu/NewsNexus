'use client';

import { useCallback, useEffect, useState } from 'react';
import MainMenu from './components/MainMenu';
import SubMenu from './components/SubMenu';
import MainContent from './components/MainContent';
import {
  fetchArticleDetail,
  fetchArticlesByDate,
  fetchDateTree,
} from './services/articleApi';
import type { ArticleDetail, ArticleListItem, DateTreeYear } from './types/article';

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function App() {
  const [dateTree, setDateTree] = useState<DateTreeYear[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => getTodayIsoDate());
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticleKey, setSelectedArticleKey] = useState<string | null>(null);
  const [pendingArticle, setPendingArticle] = useState<ArticleListItem | null>(null);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

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

    const loadArticles = async () => {
      setIsListLoading(true);
      try {
        const response = await fetchArticlesByDate(selectedDate, null);

        if (disposed) {
          return;
        }

        setArticles(response.items);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasNext);
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
  }, [selectedDate]);

  useEffect(() => {
    let disposed = false;

    if (selectedArticleId === null) {
      setArticleDetail(null);
      setIsDetailLoading(false);
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
        }
      } catch {
        if (!disposed) {
          setArticleDetail(null);
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
  }, [selectedArticleId]);

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
  };

  const handleSelectArticle = (article: ArticleListItem) => {
    const articleKey = `${article.id ?? 'null'}:${article.link}`;
    if (articleKey === selectedArticleKey) {
      if (window.matchMedia('(max-width: 767px)').matches) {
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
    } else {
      setPendingArticle(null);
      setArticleDetail(null);
      setIsDetailLoading(true);
      setSelectedArticleId(article.id);
    }

    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobileView('detail');
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (!selectedDate || !nextCursor || isListLoading || isFetchingMore) {
      return;
    }

    setIsFetchingMore(true);
    try {
      const response = await fetchArticlesByDate(selectedDate, nextCursor);
      setArticles((prev) => [...prev, ...response.items]);
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
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">NewsNexus</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h1 className="text-lg font-[650] text-slate-900">
              {mobileView === 'list' ? '기사 목록' : '기사 보기'}
            </h1>
            <button
              type="button"
              onClick={() => setIsDateSheetOpen(true)}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
            >
              {selectedDate ?? '날짜 선택'}
            </button>
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
                onClick={() => setMobileView('list')}
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

      <div className="hidden md:grid h-[calc(100vh-3rem)] grid-cols-[260px_360px_1fr] gap-3">
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
