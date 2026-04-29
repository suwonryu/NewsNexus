'use client';

import { useCallback, useEffect, useState, type SVGProps } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ArticleDetail, ArticleListItem } from '../types/article';

interface MainContentProps {
  selectedDate: string | null;
  selectedArticleId: number | null;
  pendingArticle: ArticleListItem | null;
  articleDetail: ArticleDetail | null;
  isLoading: boolean;
  className?: string;
}

function MainContent({
  selectedDate,
  selectedArticleId,
  pendingArticle,
  articleDetail,
  isLoading,
  className,
}: MainContentProps) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');

  useEffect(() => {
    setShareStatus('idle');
  }, [articleDetail?.id]);

  useEffect(() => {
    if (shareStatus === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShareStatus('idle');
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareStatus]);

  const handleShare = useCallback(async () => {
    if (!articleDetail || typeof window === 'undefined') {
      return;
    }

    const shareUrl = window.location.href;
    const shareData = {
      title: `${articleDetail.title} | 요약`,
      text: articleDetail.title,
      url: shareUrl,
    };

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareStatus('shared');
        return;
      }

      await copyToClipboard(shareUrl);
      setShareStatus('copied');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await copyToClipboard(shareUrl);
        setShareStatus('copied');
      } catch {
        setShareStatus('error');
      }
    }
  }, [articleDetail]);

  const normalizeSentiment = (sentiment: string | null) => {
    if (!sentiment) {
      return 'UNKNOWN';
    }

    const normalized = sentiment.trim().toUpperCase();

    if (normalized === 'POSITIVE' || normalized === '긍정') {
      return 'POSITIVE';
    }

    if (normalized === 'NEGATIVE' || normalized === '부정') {
      return 'NEGATIVE';
    }

    if (normalized === 'NEUTRAL' || normalized === '중립') {
      return 'NEUTRAL';
    }

    return 'UNKNOWN';
  };
  const formatSummary = (summary: string | null) => {
    if (!summary) {
      return '';
    }

    const trimmed = summary.replace(/\\n/g, '\n').trim();

    if (!trimmed) {
      return '';
    }

    if (!trimmed.startsWith('-')) {
      return trimmed;
    }

    if (/\n\s*-\s+/.test(trimmed)) {
      return trimmed;
    }

    const withoutFirstMarker = trimmed.replace(/^\s*-\s*/, '');
    const parts = withoutFirstMarker.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);

    if (parts.length <= 1) {
      return trimmed;
    }

    return parts.map((part) => `- ${part}`).join('\n');
  };
  const getSummaryText = (summary: string | null) => {
    const formatted = formatSummary(summary);
    return formatted.length > 0 ? formatted : '요약 내용이 제공되지 않았습니다.';
  };
  const formatSentiment = (sentiment: string | null) => {
    switch (normalizeSentiment(sentiment)) {
      case 'NEGATIVE':
        return '부정';
      case 'POSITIVE':
        return '긍정';
      case 'NEUTRAL':
        return '중립';
      default:
        return '분석 없음';
    }
  };
  const getSentimentBadgeClassName = (sentiment: string | null) => {
    switch (normalizeSentiment(sentiment)) {
      case 'NEGATIVE':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200';
      case 'POSITIVE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
      case 'NEUTRAL':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200';
      default:
        return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };
  const containerClassName = `overflow-visible rounded-[18px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)] md:min-h-0 md:overflow-y-auto md:overscroll-contain ${className ?? ''}`;

  if (!selectedDate) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600 dark:text-slate-300">날짜를 선택하세요</p>
      </main>
    );
  }

  if (pendingArticle) {
    return (
      <main className={containerClassName}>
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Article Detail</p>
        <h1 className="mb-2 text-3xl font-[650] text-slate-900 dark:text-slate-50">{pendingArticle.title}</h1>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">기사 내용을 불러오는 중...</p>
        <div className="mt-4 space-y-2 animate-pulse">
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-[92%] rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-[88%] rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-[74%] rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  if (selectedArticleId === null) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600 dark:text-slate-300">기사를 선택하세요</p>
      </main>
    );
  }

  if (isLoading && !articleDetail) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600 dark:text-slate-300">불러오는 중...</p>
      </main>
    );
  }

  if (!articleDetail) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600 dark:text-slate-300">기사를 선택하세요</p>
      </main>
    );
  }

  return (
    <main className={containerClassName}>
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Article Detail</p>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="min-w-0 flex-1 text-3xl font-[650] text-slate-900 dark:text-slate-50">
          {articleDetail.title}
        </h1>
        <button
          type="button"
          onClick={handleShare}
          aria-label="기사 링크 공유"
          title={shareStatus === 'copied' ? '링크 복사됨' : '기사 링크 공유'}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d2d2d7] bg-white text-slate-500 transition hover:border-[#0071e3] hover:text-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-[#424245] dark:bg-[#272729] dark:text-slate-300 dark:hover:border-[#2997ff] dark:hover:text-[#2997ff] dark:focus-visible:ring-offset-[#1d1d1f]"
        >
          <ShareIcon className="h-[1.05rem] w-[1.05rem]" />
        </button>
      </div>
      <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">뉴스 ID: {articleDetail.id}</p>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium md:font-semibold ${getSentimentBadgeClassName(articleDetail.sentiment)}`}
      >
        AI평가: {formatSentiment(articleDetail.sentiment)}
      </span>
      {shareStatus !== 'idle' && (
        <p className="mt-2 text-xs text-blue-700 dark:text-blue-300" aria-live="polite">
          {shareStatus === 'shared' && '공유 창을 열었습니다.'}
          {shareStatus === 'copied' && '링크를 복사했습니다.'}
          {shareStatus === 'error' && '링크를 공유하지 못했습니다.'}
        </p>
      )}
      <article className="prose prose-slate mt-6 max-w-none font-[420] leading-7 dark:prose-invert [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1">
        <ReactMarkdown>{getSummaryText(articleDetail.summary)}</ReactMarkdown>
      </article>
      <a
        href={articleDetail.link}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-[#0071e3] bg-[#0071e3] px-4 py-2 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1d1d1f] md:font-semibold"
      >
        원문 보기
      </a>
    </main>
  );
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();

  const succeeded = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!succeeded) {
    throw new Error('Clipboard write failed');
  }
}

function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.25 8.25L9.75 10.875M14.25 15.75L9.75 13.125"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="6.75" r="2.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="17.25" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default MainContent;
