import Link from 'next/link';
import type { ArticleListItem } from '../../types/article';
import type { BankImpact, HomeData, HomeIssueCluster } from '../../services/home';
import { getTopicDisplayName } from '../../services/contentQuality';

interface NewsHomeProps {
  home: HomeData;
  recentArticles: ArticleListItem[];
  publishedTopicSlugs: string[];
}

const IMPACT_LABELS: Record<BankImpact, string> = {
  POSITIVE: '긍정 영향',
  NEGATIVE: '부정 영향',
  NEUTRAL: '중립',
  MIXED: '혼합 영향',
};

const IMPACT_STYLES: Record<BankImpact, string> = {
  POSITIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
  NEGATIVE: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
  NEUTRAL: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200',
  MIXED: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
};

export function NewsHome({ home, recentArticles, publishedTopicSlugs }: NewsHomeProps) {
  const briefing = home.latestReadyBriefing;
  const isPreparing = home.todayStatus === 'PREPARING';

  return (
    <main className="min-h-screen px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="site-container">
        <section className="mt-8 overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur dark:border-white/10 dark:bg-[#18181a]/90 dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="grid gap-0 lg:grid-cols-[1.5fr_0.5fr]">
            <div className="p-6 sm:p-9 lg:p-11">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    isPreparing
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
                  }`}
                >
                  {isPreparing ? '오늘 브리핑 집계 중' : '오늘 브리핑 완료'}
                </span>
                {briefing && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    최신 완료 {formatDate(briefing.date)}
                  </span>
                )}
              </div>

              <h1 className="mt-6 max-w-4xl text-3xl font-[750] leading-[1.18] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
                {briefing?.displayHeadline ?? '카카오뱅크의 오늘을 분석하고 있습니다'}
              </h1>
              <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
                {briefing?.displaySummary ??
                  '관련 기사와 중복 보도를 정리해 가장 중요한 변화와 카카오뱅크 영향을 곧 제공하겠습니다.'}
              </p>

              {briefing && briefing.topicTags.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="핵심 주제">
                  {briefing.topicTags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    >
                      {getTopicDisplayName(tag)}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {briefing && (
                  <Link
                    href={`/briefing/${briefing.date}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,113,227,0.24)] transition hover:bg-[#0066cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 dark:bg-[#2997ff] dark:text-black"
                  >
                    브리핑 전체 보기
                  </Link>
                )}
                <Link
                  href="/archive"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  지난 브리핑
                </Link>
              </div>
            </div>

            <aside className="border-t border-slate-200/80 bg-slate-50/80 p-6 dark:border-white/10 dark:bg-white/[0.035] sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Today&apos;s collection
              </p>
              <p className="mt-5 text-5xl font-[760] tracking-[-0.05em] text-slate-950 dark:text-white">
                {home.collection.articleCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                오늘 수집된 기사입니다. 관련도 분석을 거쳐 직접 관련 이슈만 핵심 영역에 반영합니다.
              </p>
              <dl className="mt-8 space-y-4 border-t border-slate-200 pt-5 text-sm dark:border-white/10">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">기준 날짜</dt>
                  <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {formatDate(home.today)}
                  </dd>
                </div>
                {home.collection.lastCollectedAt && (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">마지막 수집</dt>
                    <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {formatDateTime(home.collection.lastCollectedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="issues-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">핵심 이슈</p>
              <h2
                id="issues-heading"
                className="mt-2 text-2xl font-[730] tracking-[-0.035em] text-slate-950 dark:text-white sm:text-3xl"
              >
                여러 보도를 하나의 맥락으로
              </h2>
            </div>
            {briefing && (
              <p className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">
                {formatDate(briefing.date)} 기준
              </p>
            )}
          </div>

          {home.topClusters.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {home.topClusters.slice(0, 3).map((cluster, index) => (
                <IssueCard
                  key={cluster.id}
                  cluster={cluster}
                  rank={index + 1}
                  topicPublished={
                    cluster.topicSlug !== null && publishedTopicSlugs.includes(cluster.topicSlug)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 text-slate-600 dark:border-white/15 dark:bg-white/[0.025] dark:text-slate-300">
              이슈별 관련도와 중복 보도를 분석하고 있습니다.
            </div>
          )}
        </section>

        {home.watchNext.length > 0 && (
          <section
            className="mt-12 rounded-[26px] bg-slate-950 px-6 py-7 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] dark:bg-white dark:text-slate-950 sm:px-8"
            aria-labelledby="watch-next-heading"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Watch next
            </p>
            <h2 id="watch-next-heading" className="mt-2 text-2xl font-[720] tracking-[-0.03em]">
              다음에 확인할 것
            </h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {home.watchNext.slice(0, 3).map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl bg-white/10 p-4 text-sm leading-6 dark:bg-slate-100"
                >
                  <span className="font-semibold text-[#62b0ff] dark:text-[#0066cc]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-14" aria-labelledby="articles-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">기사별 보기</p>
              <h2
                id="articles-heading"
                className="mt-2 text-2xl font-[730] tracking-[-0.035em] text-slate-950 dark:text-white sm:text-3xl"
              >
                최신 기사 탐색
              </h2>
            </div>
            <Link
              href="/explore?view=articles"
              className="text-sm font-semibold text-[#0066cc] hover:underline dark:text-[#2997ff]"
            >
              기사별 보기
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 bg-white/85 shadow-[0_16px_48px_rgba(15,23,42,0.06)] dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.035]">
            {recentArticles.slice(0, 8).map((article) => (
              <li key={`${article.id ?? 'original'}-${article.link}`}>
                <Link
                  href={article.id ? `/news/${article.id}` : article.link}
                  className="group flex items-start justify-between gap-5 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-white/5 sm:px-6"
                >
                  <div className="min-w-0">
                    <h3 className="font-[620] leading-6 text-slate-900 group-hover:text-[#0066cc] dark:text-white dark:group-hover:text-[#2997ff]">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {article.sourceName} · {article.id ? '요약 보기' : '원문만'}
                    </p>
                  </div>
                  <span aria-hidden="true" className="mt-0.5 text-slate-400">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function IssueCard({
  cluster,
  rank,
  topicPublished,
}: {
  cluster: HomeIssueCluster;
  rank: number;
  topicPublished: boolean;
}) {
  const impact = cluster.bankImpact ?? 'NEUTRAL';
  const href = cluster.representativeArticleId
    ? `/news/${cluster.representativeArticleId}`
    : '/explore';

  return (
    <article className="flex min-h-full flex-col rounded-[24px] border border-slate-200 bg-white/90 p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400">ISSUE {rank}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${IMPACT_STYLES[impact]}`}>
          카카오뱅크 {IMPACT_LABELS[impact]}
        </span>
      </div>
      <h3 className="mt-5 text-xl font-[700] leading-7 tracking-[-0.025em] text-slate-950 dark:text-white">
        {cluster.title}
      </h3>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {cluster.summary}
      </p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-black/20">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">영향 근거</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {cluster.impactReason}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 pt-5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          기사 {cluster.articleCount}건 · {cluster.sourceCount}개 매체
        </p>
        <div className="flex items-center gap-3">
          {topicPublished && cluster.topicSlug && (
            <Link
              href={`/topics/${cluster.topicSlug}`}
              className="text-sm font-semibold text-slate-600 hover:underline dark:text-slate-300"
            >
              주제 흐름
            </Link>
          )}
          <Link
            href={href}
            className="text-sm font-semibold text-[#0066cc] hover:underline dark:text-[#2997ff]"
          >
            대표 기사
          </Link>
        </div>
      </div>
      {cluster.articles.length > 1 && (
        <details className="mt-4 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
          <summary className="cursor-pointer font-semibold text-slate-600 marker:text-slate-400 hover:text-[#0066cc] dark:text-slate-300 dark:hover:text-[#2997ff]">
            함께 묶인 기사 {cluster.articles.length - 1}건 펼쳐보기
          </summary>
          <ul className="mt-3 space-y-2">
            {cluster.articles.slice(1).map((article) => (
              <li key={`${article.id ?? 'original'}-${article.link}`}>
                <Link
                  href={article.id ? `/news/${article.id}` : article.link}
                  className="block rounded-xl bg-slate-50 px-3 py-2.5 leading-5 text-slate-700 hover:text-[#0066cc] dark:bg-black/20 dark:text-slate-200 dark:hover:text-[#2997ff]"
                >
                  {article.title}
                  <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                    {article.sourceName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function formatDate(value: string): string {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]}` : value;
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
