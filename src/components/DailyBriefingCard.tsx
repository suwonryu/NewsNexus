import type { CSSProperties } from 'react';
import type { DailyBriefingResponse } from '../services/dailyBriefing';

interface DailyBriefingCardProps {
  briefing: DailyBriefingResponse;
}

const SENTIMENT_SEGMENTS = [
  {
    key: 'POSITIVE',
    label: '긍정',
    countKey: 'positiveCount',
    stroke: '#10b981',
    dotClassName: 'bg-emerald-500',
    textClassName: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'NEGATIVE',
    label: '부정',
    countKey: 'negativeCount',
    stroke: '#f43f5e',
    dotClassName: 'bg-rose-500',
    textClassName: 'text-rose-700 dark:text-rose-300',
  },
  {
    key: 'UNRELATED',
    label: '관련 없음',
    countKey: 'unrelatedCount',
    stroke: '#64748b',
    dotClassName: 'bg-slate-500',
    textClassName: 'text-slate-700 dark:text-slate-300',
  },
] as const;

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

  const sentimentTotal =
    briefing.sentimentSummary.positiveCount +
    briefing.sentimentSummary.negativeCount +
    briefing.sentimentSummary.unrelatedCount;

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.34),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.97),rgba(236,254,255,0.96))] p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] dark:border-slate-700/60 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(8,47,73,0.92))] dark:shadow-[0_28px_68px_rgba(2,6,23,0.48)] lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60 dark:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)] dark:opacity-70" />
      <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
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

        <section className="rounded-[28px] border border-white/75 bg-white/72 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-950/38 dark:shadow-[0_18px_40px_rgba(2,6,23,0.34)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                AI Evaluation
              </p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                AI 평가 분포
              </h2>
            </div>
            <span className="rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3 py-1 text-xs font-medium text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              수집 기사 {briefing.articleCount}건
            </span>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[180px_minmax(0,1fr)] 2xl:items-center">
            <SentimentDonutChart total={sentimentTotal} briefing={briefing} />

            <div className="space-y-3">
              {SENTIMENT_SEGMENTS.map((segment) => {
                const count = briefing.sentimentSummary[segment.countKey];
                const ratio = sentimentTotal > 0 ? Math.round((count / sentimentTotal) * 100) : 0;
                const itemStyle = {
                  '--briefing-delay': `${180 + SENTIMENT_SEGMENTS.findIndex(({ key }) => key === segment.key) * 90}ms`,
                } as CSSProperties;

                return (
                  <div
                    key={segment.key}
                    className="briefing-fade-in-up flex items-center justify-between rounded-2xl border border-white/70 bg-white/58 px-4 py-3 dark:border-slate-700/55 dark:bg-slate-950/34"
                    style={itemStyle}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${segment.dotClassName}`} />
                      <span className={`text-sm font-medium ${segment.textClassName}`}>{segment.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="briefing-fade-in-up text-lg font-[720] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                        {count}건
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ratio}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function SentimentDonutChart({
  briefing,
  total,
}: {
  briefing: DailyBriefingResponse;
  total: number;
}) {
  const radius = 48;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  return (
    <div
      className="briefing-fade-in-up mx-auto flex w-full max-w-[220px] flex-col items-center"
      style={{ '--briefing-delay': '80ms' } as CSSProperties}
    >
      <div className="relative h-[140px] w-[140px]">
        <svg
          viewBox="0 0 140 140"
          className="briefing-donut h-full w-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth={strokeWidth}
          />
          {SENTIMENT_SEGMENTS.map((segment) => {
            const count = briefing.sentimentSummary[segment.countKey];

            if (count === 0 || total === 0) {
              return null;
            }

            const segmentLength = (count / total) * circumference;
            const dashOffset = -accumulatedLength;
            accumulatedLength += segmentLength;

            return (
              <circle
                key={segment.key}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={segment.stroke}
                strokeWidth={strokeWidth}
                className="briefing-donut-segment"
                style={
                  {
                    '--segment-length': segmentLength,
                    '--segment-gap': circumference - segmentLength,
                    '--segment-offset': dashOffset,
                    '--segment-circumference': circumference,
                    '--segment-delay': `${160 + SENTIMENT_SEGMENTS.findIndex(({ key }) => key === segment.key) * 90}ms`,
                  } as CSSProperties
                }
              />
            );
          })}
        </svg>

        <div
          className="briefing-fade-in-up absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ '--briefing-delay': '220ms' } as CSSProperties}
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            AI 평가
          </span>
          <span className="mt-1 text-3xl font-[760] tracking-[-0.05em] text-slate-950 dark:text-slate-50">
            {total}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300">건</span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        {total > 0
          ? '전체 기사 기준 AI 평가 분포'
          : '집계된 AI 평가 데이터가 아직 없습니다.'}
      </p>
    </div>
  );
}

export default DailyBriefingCard;
