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
        return 'bg-rose-100 text-rose-700';
      case 'POSITIVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'NEUTRAL':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-200 text-slate-600';
    }
  };
  const containerClassName = `overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur ${className ?? ''}`;

  if (!selectedDate) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600">날짜를 선택하세요</p>
      </main>
    );
  }

  if (pendingArticle) {
    return (
      <main className={containerClassName}>
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Article Detail</p>
        <h1 className="mb-2 text-3xl font-[650] text-slate-900">{pendingArticle.title}</h1>
        <p className="mb-2 text-sm text-slate-600">뉴스 ID: 준비중</p>
        <article className="prose prose-slate mt-6 max-w-none font-[420] leading-7 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_li]:my-1">
          <ReactMarkdown>{'요약 준비중입니다.'}</ReactMarkdown>
        </article>
        <a
          href={pendingArticle.link}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-sm font-medium md:font-semibold text-white transition hover:bg-cyan-700 hover:border-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        >
          원문 보기
        </a>
      </main>
    );
  }

  if (selectedArticleId === null) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600">기사를 선택하세요</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600">불러오는 중...</p>
      </main>
    );
  }

  if (!articleDetail) {
    return (
      <main className={containerClassName}>
        <p className="text-slate-600">기사를 선택하세요</p>
      </main>
    );
  }

  return (
    <main className={containerClassName}>
      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-500">Article Detail</p>
      <h1 className="mb-2 text-3xl font-[650] text-slate-900">{articleDetail.title}</h1>
      <p className="mb-2 text-sm text-slate-600">뉴스 ID: {articleDetail.id}</p>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium md:font-semibold ${getSentimentBadgeClassName(articleDetail.sentiment)}`}
      >
        AI평가: {formatSentiment(articleDetail.sentiment)}
      </span>
      <article className="prose prose-slate mt-6 max-w-none font-[420] leading-7 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_li]:my-1">
        <ReactMarkdown>{getSummaryText(articleDetail.summary)}</ReactMarkdown>
      </article>
      <a
        href={articleDetail.link}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-sm font-medium md:font-semibold text-white transition hover:bg-cyan-700 hover:border-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
      >
        원문 보기
      </a>
    </main>
  );
}

export default MainContent;
