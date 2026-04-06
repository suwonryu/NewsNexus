'use client';

import posthog from 'posthog-js';
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
  const containerClassName = `overflow-visible rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur transition dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_18px_44px_rgba(2,6,23,0.4)] md:min-h-0 md:overflow-y-auto md:overscroll-contain ${className ?? ''}`;

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
      <h1 className="mb-2 text-3xl font-[650] text-slate-900 dark:text-slate-50">{articleDetail.title}</h1>
      <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">뉴스 ID: {articleDetail.id}</p>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium md:font-semibold ${getSentimentBadgeClassName(articleDetail.sentiment)}`}
      >
        AI평가: {formatSentiment(articleDetail.sentiment)}
      </span>
      <article className="prose prose-slate mt-6 max-w-none font-[420] leading-7 dark:prose-invert [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1">
        <ReactMarkdown>{getSummaryText(articleDetail.summary)}</ReactMarkdown>
      </article>
      <a
        href={articleDetail.link}
        target="_blank"
        rel="noreferrer"
        onClick={() => posthog.capture('article_original_link_clicked', { article_id: articleDetail.id, title: articleDetail.title })}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-700 hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 md:font-semibold"
      >
        원문 보기
      </a>
    </main>
  );
}

export default MainContent;
