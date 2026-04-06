import type { DailyBriefingResponse } from '../services/dailyBriefing';

interface DailyBriefingCardProps {
  briefing: DailyBriefingResponse;
}

function DailyBriefingCard({ briefing }: DailyBriefingCardProps) {
  if (briefing.status !== 'READY' || !briefing.summary) {
    return (
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur transition dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_24px_54px_rgba(2,6,23,0.42)]">
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
    <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.34),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.97),rgba(236,254,255,0.96))] p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] dark:border-slate-700/60 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(8,47,73,0.92))] dark:shadow-[0_28px_68px_rgba(2,6,23,0.48)] lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60 dark:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] dark:opacity-70" />
      <div className="relative grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-800/80 dark:text-cyan-200/80">
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
                className="rounded-full border border-cyan-200/90 bg-white/78 px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:border-cyan-400/30 dark:bg-slate-950/35 dark:text-slate-100"
              >
                #{keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard label="수집 기사" value={`${briefing.articleCount}건`} />
          <MetricCard label="출처" value={`${briefing.sourceCount}곳`} />
          <MetricCard
            label="대표 헤드라인"
            value={`${Math.min(briefing.featuredArticles.length, 5)}개`}
          />
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-white/75 bg-white/75 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-700/55 dark:bg-slate-950/40 dark:shadow-[0_14px_30px_rgba(2,6,23,0.32)]">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950 dark:text-slate-50">{value}</div>
    </div>
  );
}

export default DailyBriefingCard;
