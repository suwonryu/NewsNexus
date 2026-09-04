import type { DailyBriefingResponse } from '../services/dailyBriefing';
import { normalizeEditorialText } from '../services/contentPresentation';

interface DailyBriefingCardProps {
  briefing: DailyBriefingResponse;
}

function DailyBriefingCard({ briefing }: DailyBriefingCardProps) {
  if (briefing.status !== 'READY' || !briefing.summary) {
    return (
      <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Daily Briefing</p>
        <h2 className="mt-3 text-3xl font-[760] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
          {briefing.date} 브리핑
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          이날은 따로 정리해드릴 소식이 없어요. 다른 날짜의 브리핑을 둘러보세요.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-[0_10px_34px_rgba(0,0,0,0.07)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_24px_58px_rgba(0,0,0,0.42)] lg:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80 dark:bg-white/10" />
      <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-blue-800/80 dark:text-blue-200/80">
            Daily Briefing
          </p>
          <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 lg:text-5xl">
            오늘의 핵심 흐름
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-200">
            {normalizeEditorialText(briefing.summary, 3)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {briefing.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-blue-200/90 bg-white/78 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:border-blue-400/30 dark:bg-slate-950/35 dark:text-slate-100"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>

        <section className="rounded-[18px] border border-[#d2d2d7] bg-[#f5f5f7] p-5 dark:border-[#424245] dark:bg-[#272729]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                한눈에 보기
              </p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                오늘 살펴본 뉴스
              </h2>
            </div>
            <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
              {briefing.articleCount}건의 소식
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <AnalysisCount label="관련 뉴스" value={briefing.articleCount} />
            <AnalysisCount label="언론사" value={briefing.sourceCount} suffix="곳" />
            <AnalysisCount label="깊이 읽기" value={briefing.featuredArticles.length} />
          </dl>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-blue-950 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
            각 소식이 카카오뱅크에 어떤 의미가 있는지, 아래에서 흐름과 함께 살펴보세요.
          </div>
        </section>
      </div>
    </section>
  );
}

function AnalysisCount({
  label,
  value,
  suffix = '건',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-4 dark:border-slate-700/55 dark:bg-slate-950/34">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-[730] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
        {value}{suffix}
      </dd>
    </div>
  );
}

export default DailyBriefingCard;
