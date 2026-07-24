import type { DailyBriefingResponse } from '../services/dailyBriefing';

interface DailyBriefingCardProps {
  briefing: DailyBriefingResponse;
}

function DailyBriefingCard({ briefing }: DailyBriefingCardProps) {
  if (briefing.status !== 'READY' || !briefing.summary) {
    return (
      <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Daily Briefing</p>
        <h1 className="mt-3 text-3xl font-[760] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
          {briefing.date} 브리핑
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          아직 브리핑을 구성할 수 있는 기사 데이터가 없습니다.
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
          <h1 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 lg:text-5xl">
            {briefing.date} 브리핑
          </h1>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-200">
            {briefing.summary}
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
                Analysis Scope
              </p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                브리핑 분석 범위
              </h2>
            </div>
            <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
              수집 기사 {briefing.articleCount}건
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <AnalysisCount label="수집 기사" value={briefing.articleCount} />
            <AnalysisCount label="수집 출처" value={briefing.sourceCount} suffix="개" />
            <AnalysisCount label="대표 기사" value={briefing.featuredArticles.length} />
          </dl>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-6 text-blue-950 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-100">
            긍정·부정 비율 대신, 아래 편집 분석과 이슈별 카드에서 카카오뱅크에 미치는
            영향과 근거를 함께 제공합니다.
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
