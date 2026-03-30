'use client';

import posthog from 'posthog-js';
import Link from 'next/link';
import type { DailyBriefingArticle } from '../services/dailyBriefing';

export function BriefingArticleCard({
  article,
  index,
}: {
  article: DailyBriefingArticle;
  index: number;
}) {
  const className =
    'group flex h-full flex-col rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.94))] px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-cyan-300 hover:shadow-[0_16px_36px_rgba(8,145,178,0.12)]';

  const content = (
    <>
      <div className="mt-3 flex min-h-[6.25rem] items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-semibold text-white">
          {index + 1}
        </span>
        <div className="flex min-h-[6.25rem] flex-1 flex-col">
          <h3 className="text-lg font-[680] leading-7 tracking-[-0.03em] text-slate-950">
            {article.title}
          </h3>
          <div className="mt-3 break-all text-xs text-slate-500 lowercase">
            {article.sourceName}
          </div>
          <div className="mt-auto pt-4">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 group-hover:bg-cyan-50 group-hover:text-cyan-800">
              {article.id !== null ? '요약 기사 보기' : '원문 열기'}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const handleClick = () => {
    posthog.capture('briefing_article_clicked', {
      article_id: article.id,
      title: article.title,
      source: article.sourceName,
      is_internal: article.id !== null,
    });
  };

  if (article.id !== null) {
    return (
      <Link href={`/news/${article.id}`} className={className} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return (
    <a href={article.link} target="_blank" rel="noreferrer" className={className} onClick={handleClick}>
      {content}
    </a>
  );
}
