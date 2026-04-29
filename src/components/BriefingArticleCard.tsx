'use client';

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
    'group flex h-full flex-col rounded-[18px] border border-[#d2d2d7] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.04)] transition hover:border-[#0071e3] hover:shadow-[0_12px_30px_rgba(0,113,227,0.10)] dark:border-[#424245] dark:bg-[#272729] dark:hover:border-[#2997ff] dark:hover:shadow-[0_18px_38px_rgba(0,0,0,0.42)]';

  const content = (
    <>
      <div className="mt-3 flex min-h-[6.25rem] items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-xs font-semibold text-white">
          {index + 1}
        </span>
        <div className="flex min-h-[6.25rem] flex-1 flex-col">
          <h3 className="text-lg font-[680] leading-7 tracking-[-0.03em] text-slate-950 dark:text-slate-50">
            {article.title}
          </h3>
          <div className="mt-3 break-all text-xs text-slate-500 lowercase dark:text-slate-400">
            {article.sourceName}
          </div>
          <div className="mt-auto pt-4">
            <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-slate-700 group-hover:bg-blue-50 group-hover:text-[#0066cc] dark:bg-[#2a2a2c] dark:text-slate-200 dark:group-hover:bg-blue-500/15 dark:group-hover:text-[#2997ff]">
              {article.id !== null ? '요약 기사 보기' : '원문 열기'}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  if (article.id !== null) {
    return (
      <Link href={`/news/${article.id}`} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a href={article.link} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  );
}
