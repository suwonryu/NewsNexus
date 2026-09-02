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
    return formatted.length > 0
      ? formatted
      : '이 기사에는 짧은 요약이 없어요. 원문에서 자세한 내용을 확인해 주세요.';
  };
  const formatImpact = (
    impact: NonNullable<ArticleDetail['analysis']>['impact'] | null,
  ) => {
    switch (impact) {
      case 'NEGATIVE':
        return '부정 영향';
      case 'POSITIVE':
        return '긍정 영향';
      case 'NEUTRAL':
        return '중립';
      case 'MIXED':
        return '혼합 영향';
      default:
        return '영향 살펴보는 중';
    }
  };
  const getImpactBadgeClassName = (impact: string | null | undefined) => {
    switch (impact) {
      case 'NEGATIVE':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200';
      case 'POSITIVE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
      case 'NEUTRAL':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200';
      case 'MIXED':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
      default:
        return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };
  const formatRelevance = (level: string | undefined) => {
    switch (level) {
      case 'DIRECT':
        return '직접 관련';
      case 'INDUSTRY':
        return '산업 관련';
      case 'IRRELEVANT':
        return '관련 없음';
      default:
        return '분류 전';
    }
  };
  const formatHorizon = (horizon: string | null | undefined) => {
    switch (horizon) {
      case 'SHORT':
        return '단기';
      case 'MEDIUM':
        return '중기';
      case 'LONG':
        return '장기';
      default:
        return null;
    }
  };
  const containerClassName = `overflow-visible rounded-[18px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)] md:min-h-0 md:overflow-y-auto md:overscroll-contain ${className ?? ''}`;

  if (!selectedDate) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600 dark:text-slate-300">먼저 살펴볼 날짜를 골라주세요.</p>
      </main>
    );
  }

  if (pendingArticle) {
    return (
      <main className={containerClassName}>
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Article Detail</p>
        <h2 className="mb-2 text-3xl font-[650] text-slate-900 dark:text-slate-50">{pendingArticle.title}</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">핵심 내용을 불러오고 있어요.</p>
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
        <p className="text-slate-600 dark:text-slate-300">읽고 싶은 기사를 선택해 주세요.</p>
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
        <p className="text-slate-600 dark:text-slate-300">읽고 싶은 기사를 선택해 주세요.</p>
      </main>
    );
  }

  return (
    <main className={containerClassName}>
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Article Detail</p>
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-3xl font-[650] text-slate-900 dark:text-slate-50">
          {articleDetail.title}
        </h2>
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
      {articleDetail.analysis && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 md:font-semibold">
            {formatRelevance(articleDetail.analysis.relevanceLevel)}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium md:font-semibold ${getImpactBadgeClassName(articleDetail.analysis.impact)}`}
          >
            카카오뱅크 영향: {formatImpact(articleDetail.analysis.impact ?? null)}
          </span>
          {articleDetail.analysis.impactConfidence > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              분석 신뢰도 {Math.round(getDisplayedImpactConfidence(articleDetail.analysis) * 100)}%
            </span>
          )}
        </div>
      )}
      {articleDetail.analysis ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">카카오뱅크와의 연결</p>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {articleDetail.analysis.relevanceReason}
            </p>
            {articleDetail.analysis.impactDimensions.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="영향 점검 영역">
                {articleDetail.analysis.impactDimensions.map((dimension) => (
                  <li
                    key={dimension}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {formatImpactDimension(dimension)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              왜 눈여겨볼까
              {formatHorizon(articleDetail.analysis.impactHorizon)
                ? ` · ${formatHorizon(articleDetail.analysis.impactHorizon)}`
                : ''}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
              {getArticleImpactReason(articleDetail)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          이 기사는 핵심 내용만 간단히 소개합니다. 자세한 맥락은 원문에서 확인해 주세요.
        </p>
      )}
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
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
        <p className="font-semibold">AI 요약·분석 안내</p>
        <p className="mt-1">
          자동 생성된 요약으로 오류가 있을 수 있습니다. {getSourceName(articleDetail.link)}의 원문과
          함께 확인해 주세요
          {articleDetail.publishedDate ? ` · 기사 날짜 ${articleDetail.publishedDate}` : ''}.
        </p>
      </div>
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

function getSourceName(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return '원 언론사';
  }
}

function formatImpactDimension(dimension: string): string {
  const labels: Record<string, string> = {
    REVENUE: '수익성',
    COST: '비용',
    CREDIT_RISK: '신용·건전성',
    REGULATION: '규제',
    BRAND: '브랜드·고객',
    OPERATIONS: '서비스 운영',
    GROWTH: '성장',
  };
  return labels[dimension] ?? dimension;
}

function getDisplayedImpactConfidence(
  analysis: NonNullable<ArticleDetail['analysis']>,
): number {
  const evidenceCount = Math.max(1, new Set(analysis.evidenceArticleIds).size);
  const evidenceCeiling = Math.min(
    0.84,
    0.56 + Math.max(0, evidenceCount - 1) * 0.09,
  );
  return Math.min(analysis.impactConfidence, evidenceCeiling);
}

function getArticleImpactReason(article: ArticleDetail): string {
  const raw = article.analysis?.impactReason ??
    '이 소식이 카카오뱅크에 미칠 영향은 아직 뚜렷하지 않습니다.';
  const localized = Object.entries({
    CREDIT_RISK: '신용·건전성',
    OPERATIONS: '서비스 운영',
    REGULATION: '규제',
    REVENUE: '수익성',
    GROWTH: '성장',
    BRAND: '브랜드·고객',
    COST: '비용',
  }).reduce((text, [code, label]) => text.replaceAll(code, label), raw);
  if (localized.includes('근거:')) {
    return localized;
  }
  const evidence = getFirstSummarySentence(article.summary);
  return evidence ? `${localized} 근거: ${evidence}` : localized;
}

function getFirstSummarySentence(summary: string | null): string {
  if (!summary) {
    return '';
  }
  const normalized = summary
    .replace(/\\n/g, ' ')
    .replace(/^\s*[-•]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.split(/(?<=[.!?])\s+/u)[0] ?? '';
}

export default MainContent;
