import { type MouseEvent, useEffect, useRef } from 'react';
import type { ArticleListItem } from '../types/article';

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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  const canOpenNullIdArticle = selectedDate === todayIsoDate;
  const shouldHandleInPlaceNavigation = (event: MouseEvent<HTMLAnchorElement>) =>
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;

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

  return (
    <aside
      className={`overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur ${className ?? ''}`}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2">Stories</p>
      <h2 className="text-xl font-[650] mb-4 text-slate-900">기사 목록</h2>

      {!selectedDate && <p className="text-sm text-slate-600">날짜를 선택하세요</p>}

      {selectedDate && (
        <>
          <p className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {selectedDate}
          </p>
          <ul className="space-y-2">
            {items.map((article) => (
              <li key={`${article.id ?? 'null'}:${article.link}`}>
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
                      selectedArticleKey === `${article.id}:${article.link}`
                        ? 'border-cyan-500 bg-cyan-50 shadow-[0_6px_18px_rgba(14,116,144,0.18)]'
                        : 'border-slate-200 bg-white/90 hover:border-cyan-300 hover:bg-cyan-50/40'
                    }`}
                  >
                    <div className="text-sm font-[650] text-slate-900">{article.title}</div>
                    <div className="mt-1 text-xs text-slate-600">{article.sourceName}</div>
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
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white/90 hover:border-cyan-300 hover:bg-cyan-50/40'
                    }`}
                  >
                    <div className="text-sm font-[650] text-slate-900">{article.title}</div>
                    <div className="mt-1 text-xs text-slate-600">{article.sourceName}</div>
                    {!canOpenNullIdArticle && (
                      <div className="mt-1 text-xs text-slate-500">상세 조회 불가</div>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isLoading && <p className="mt-3 text-xs text-slate-500">불러오는 중...</p>}
          {selectedDate && !isLoading && items.length === 0 && (
            <p className="text-sm text-slate-600">기사가 없습니다</p>
          )}

          <div ref={sentinelRef} className="h-3" />
        </>
      )}
    </aside>
  );
}

export default SubMenu;
