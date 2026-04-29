import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ArticleListItem } from '../types/article';

type AvailabilityFilter = 'all' | 'detail' | 'source';

interface SubMenuProps {
  selectedDate: string | null;
  items: ArticleListItem[];
  selectedArticleKey: string | null;
  isLoading: boolean;
  hasMore: boolean;
  onSelectArticle: (article: ArticleListItem) => void;
  onLoadMore: () => void;
  className?: string;
}

function SubMenu({
  selectedDate,
  items,
  selectedArticleKey,
  isLoading,
  hasMore,
  onSelectArticle,
  onLoadMore,
  className,
}: SubMenuProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const previousSelectedKeyRef = useRef<string | null>(null);
  const previousSelectedItemVisibleRef = useRef(false);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const canOpenNullIdArticle = selectedDate === todayIsoDate;
  const shouldHandleInPlaceNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;

  useEffect(() => {
    setQuery('');
    setSourceFilter('all');
    setAvailabilityFilter('all');
  }, [selectedDate]);

  const sourceOptions = useMemo(
    () => [...new Set(items.map((article) => article.sourceName))].sort((a, b) => a.localeCompare(b, 'ko')),
    [items],
  );
  const trimmedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const visibleItems = useMemo(
    () =>
      items.filter((article) => {
        const matchesQuery =
          trimmedQuery.length === 0 ||
          article.title.toLocaleLowerCase('ko-KR').includes(trimmedQuery) ||
          article.sourceName.toLocaleLowerCase('ko-KR').includes(trimmedQuery);
        const matchesSource = sourceFilter === 'all' || article.sourceName === sourceFilter;
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'detail' && article.id !== null) ||
          (availabilityFilter === 'source' && article.id === null);

        return matchesQuery && matchesSource && matchesAvailability;
      }),
    [availabilityFilter, items, sourceFilter, trimmedQuery],
  );
  const hasActiveFilters =
    trimmedQuery.length > 0 || sourceFilter !== 'all' || availabilityFilter !== 'all';
  const resetFilters = () => {
    setQuery('');
    setSourceFilter('all');
    setAvailabilityFilter('all');
  };

  useEffect(() => {
    if (!selectedDate || !hasMore || isLoading) {
      return;
    }

    const target = sentinelRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '120px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [selectedDate, hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    if (!selectedArticleKey) {
      previousSelectedKeyRef.current = null;
      previousSelectedItemVisibleRef.current = false;
      return;
    }

    const container = containerRef.current;
    const selectedItem = itemRefs.current.get(selectedArticleKey);
    const selectedItemVisible = Boolean(selectedItem);
    const selectedItemJustAppeared =
      !previousSelectedItemVisibleRef.current && selectedItemVisible;

    previousSelectedKeyRef.current = selectedArticleKey;
    previousSelectedItemVisibleRef.current = selectedItemVisible;

    if (!container || !selectedItem || !selectedItemJustAppeared) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = selectedItem.getBoundingClientRect();
    const isAboveViewport = itemRect.top < containerRect.top + 16;
    const isBelowViewport = itemRect.bottom > containerRect.bottom - 16;

    if (isAboveViewport || isBelowViewport) {
      selectedItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [visibleItems.length, selectedArticleKey]);

  return (
    <aside
      ref={containerRef}
      className={`overflow-visible rounded-[18px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)] md:min-h-0 md:overflow-y-auto md:overscroll-contain ${className ?? ''}`}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2 dark:text-slate-400">Stories</p>
      <h2 className="text-xl font-[650] mb-4 text-slate-900 dark:text-slate-50">기사 목록</h2>

      {!selectedDate && <p className="text-sm text-slate-600 dark:text-slate-300">날짜를 선택하세요</p>}

      {selectedDate && (
        <>
          <p className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {selectedDate}
          </p>

          <div className="mb-4 space-y-2 rounded-[18px] border border-[#d2d2d7] bg-[#f5f5f7] p-3 dark:border-[#424245] dark:bg-[#272729]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목 또는 출처 검색"
              aria-label="기사 검색"
              className="h-10 w-full rounded-xl border border-[#d2d2d7] bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 dark:border-[#424245] dark:bg-[#1d1d1f] dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[#2997ff] dark:focus:ring-[#2997ff]/20"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                aria-label="출처 필터"
                className="h-9 min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 dark:border-[#424245] dark:bg-[#1d1d1f] dark:text-slate-200 dark:focus:border-[#2997ff] dark:focus:ring-[#2997ff]/20"
              >
                <option value="all">전체 출처</option>
                {sourceOptions.map((sourceName) => (
                  <option key={sourceName} value={sourceName}>
                    {sourceName}
                  </option>
                ))}
              </select>
              <select
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value as AvailabilityFilter)}
                aria-label="상세 조회 필터"
                className="h-9 min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 dark:border-[#424245] dark:bg-[#1d1d1f] dark:text-slate-200 dark:focus:border-[#2997ff] dark:focus:ring-[#2997ff]/20"
              >
                <option value="all">전체 기사</option>
                <option value="detail">요약 있음</option>
                <option value="source">원문만</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {visibleItems.length} / {items.length}건
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full px-2 py-1 font-medium text-[#0066cc] transition hover:bg-blue-50 dark:text-[#2997ff] dark:hover:bg-blue-500/10"
                >
                  초기화
                </button>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {visibleItems.map((article) => {
              const articleKey = `${article.id ?? 'null'}:${article.link}`;
              const isSelected = selectedArticleKey === `${article.id}:${article.link}`;

              return (
                <li
                  key={articleKey}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(articleKey, node);
                    } else {
                      itemRefs.current.delete(articleKey);
                    }
                  }}
                >
                  {article.id !== null ? (
                    <a
                      href={`/news/${article.id}`}
                      onClick={(event) => {
                        if (!shouldHandleInPlaceNavigation(event)) {
                          return;
                        }
                        event.preventDefault();
                        onSelectArticle(article);
                      }}
                      className={`block w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-[#0071e3] bg-blue-50 shadow-[0_6px_18px_rgba(0,113,227,0.12)] dark:border-[#2997ff] dark:bg-blue-950/50 dark:shadow-[0_14px_30px_rgba(0,113,227,0.16)]'
                          : 'border-[#d2d2d7] bg-white hover:border-[#0071e3] hover:bg-blue-50/35 dark:border-[#424245] dark:bg-[#272729] dark:hover:border-[#2997ff] dark:hover:bg-blue-500/10'
                      }`}
                    >
                      <div
                        className={`text-sm font-[650] ${
                          isSelected
                            ? 'text-slate-900 dark:text-blue-50'
                            : 'text-slate-900 dark:text-slate-50'
                        }`}
                      >
                        {article.title}
                      </div>
                      <div
                        className={`mt-1 text-xs ${
                          isSelected
                            ? 'text-slate-600 dark:text-blue-100/75'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {article.sourceName}
                      </div>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (canOpenNullIdArticle) {
                          onSelectArticle(article);
                        }
                      }}
                      disabled={!canOpenNullIdArticle}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        !canOpenNullIdArticle
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-500'
                          : 'border-[#d2d2d7] bg-white hover:border-[#0071e3] hover:bg-blue-50/35 dark:border-[#424245] dark:bg-[#272729] dark:hover:border-[#2997ff] dark:hover:bg-blue-500/10'
                      }`}
                    >
                      <div className="text-sm font-[650] text-slate-900 dark:text-slate-50">{article.title}</div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{article.sourceName}</div>
                      {!canOpenNullIdArticle && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">상세 조회 불가</div>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {isLoading && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">불러오는 중...</p>}
          {selectedDate && !isLoading && items.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-300">기사가 없습니다</p>
          )}
          {selectedDate && !isLoading && items.length > 0 && visibleItems.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
              필터와 일치하는 기사가 없습니다
            </p>
          )}

          <div ref={sentinelRef} className="h-3" />
        </>
      )}
    </aside>
  );
}

export default SubMenu;
