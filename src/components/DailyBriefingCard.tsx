import type { DailyBriefingResponse } from '../services/dailyBriefing';

interface DailyBriefingCardProps {
  briefing: DailyBriefingResponse;
}

function DailyBriefingCard({ briefing }: DailyBriefingCardProps) {
  if (briefing.status !== 'READY' || !briefing.summary) {
    return (
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Daily Briefing</p>
        <h1 className="mt-3 text-3xl font-[760] tracking-[-0.04em] text-slate-950">
          {briefing.date} 브리핑
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          아직 브리핑을 구성할 수 있는 기사 데이터가 없습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.34),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.97),rgba(236,254,255,0.96))] p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60" />
      <div className="relative grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-800/80">
            Daily Briefing
          </p>
          <h1 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 lg:text-5xl">
            {briefing.date} 브리핑
          </h1>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-700">
            {briefing.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {briefing.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-cyan-200/90 bg-white/78 px-3.5 py-1.5 text-sm font-medium text-slate-700"
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
    <div className="rounded-3xl border border-white/75 bg-white/75 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950">{value}</div>
    </div>
  );
}

export default DailyBriefingCard;
