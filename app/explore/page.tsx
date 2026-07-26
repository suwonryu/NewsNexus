import type { Metadata } from 'next';
import Link from 'next/link';
import App from '../../src/App';
import { getKoreaIsoDate } from '../../src/lib/koreaDate';
import { getArticlesByDate, getDateTree } from '../../src/services/articleServerApi';
import { getHomeData, getIssues, type HomeIssueCluster } from '../../src/services/home';

export const metadata: Metadata = {
  title: '카카오뱅크 기사 탐색',
  description: '날짜별 카카오뱅크 뉴스 기사와 AI 요약을 탐색합니다.',
  alternates: {
    canonical: '/explore',
  },
};

interface ExplorePageProps {
  searchParams: Promise<{
    view?: string;
    date?: string;
    relevance?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const selectedDate = isIsoDate(params.date) ? params.date : getKoreaIsoDate();
  const relevance = params.relevance === 'INDUSTRY' ? 'INDUSTRY' : 'DIRECT';

  if (params.view !== 'articles') {
    const [issuePage, home] = await Promise.all([
      getIssues(selectedDate, relevance),
      selectedDate === getKoreaIsoDate() && relevance === 'DIRECT'
        ? getHomeData()
        : Promise.resolve(null),
    ]);
    const clusters =
      issuePage.items.length > 0 ? issuePage.items : (home?.topClusters ?? []);
    return (
      <IssueExplorer
        date={selectedDate}
        relevance={relevance}
        clusters={clusters}
      />
    );
  }

  const [response, dateTree] = await Promise.all([
    getArticlesByDate(selectedDate, null),
    getDateTree(),
  ]);

  return (
    <App
      initialSelectedDate={selectedDate}
      initialDateTree={dateTree.years}
      initialArticles={response.items}
      initialNextCursor={response.nextCursor}
      initialHasMore={response.hasNext}
    />
  );
}

function IssueExplorer({
  date,
  relevance,
  clusters,
}: {
  date: string;
  relevance: 'DIRECT' | 'INDUSTRY';
  clusters: HomeIssueCluster[];
}) {
  return (
    <main className="min-h-screen px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="site-container">
        <section className="mt-8 rounded-[26px] border border-slate-200 bg-white/85 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.035]">
          <div className="mb-5">
            <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">탐색</p>
            <h1 className="mt-2 text-3xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-white">
              이슈별 보기
            </h1>
          </div>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="relevance" value={relevance} />
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                날짜
                <input
                  type="date"
                  name="date"
                  defaultValue={date}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 dark:border-white/15 dark:bg-black/20 dark:text-white"
                />
              </label>
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                날짜 적용
              </button>
            </form>
            <nav className="flex gap-2" aria-label="탐색 보기">
              <span className="rounded-full bg-[#0071e3] px-4 py-2 text-sm font-semibold text-white dark:bg-[#2997ff] dark:text-black">
                이슈별
              </span>
              <Link
                href={`/explore?view=articles&date=${date}`}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
              >
                기사별
              </Link>
            </nav>
          </div>

          <fieldset className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
            <legend className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              관련도 필터
            </legend>
            <div className="mt-2 flex gap-2">
              <RelevanceLink
                active={relevance === 'DIRECT'}
                href={`/explore?date=${date}&relevance=DIRECT`}
                label="직접 관련"
              />
              <RelevanceLink
                active={relevance === 'INDUSTRY'}
                href={`/explore?date=${date}&relevance=INDUSTRY`}
                label="산업 관련"
              />
            </div>
          </fieldset>
        </section>

        {clusters.length > 0 ? (
          <section className="mt-8" aria-labelledby="cluster-list-heading">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="cluster-list-heading"
                className="text-2xl font-[730] tracking-[-0.035em] text-slate-950 dark:text-white"
              >
                {date} 이슈
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {clusters.length}개 묶음
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {clusters.map((cluster) => (
                <article
                  key={cluster.id}
                  className="flex flex-col rounded-[22px] border border-slate-200 bg-white/90 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <p className="text-xs font-semibold text-[#0066cc] dark:text-[#2997ff]">
                    기사 {cluster.articleCount}건 · {cluster.sourceCount}개 매체
                  </p>
                  <h3 className="mt-2 text-xl font-[690] leading-7 text-slate-950 dark:text-white">
                    {cluster.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {cluster.summary}
                  </p>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-black/20 dark:text-slate-200">
                    <span className="font-semibold">카카오뱅크 영향: </span>
                    {cluster.impactReason}
                  </div>
                  {cluster.representativeArticleId && (
                    <Link
                      href={`/news/${cluster.representativeArticleId}`}
                      className="mt-5 self-start text-sm font-semibold text-[#0066cc] hover:underline dark:text-[#2997ff]"
                    >
                      대표 기사 보기
                    </Link>
                  )}
                  {cluster.articles.length > 1 && (
                    <details className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-600 hover:text-[#0066cc] dark:text-slate-300 dark:hover:text-[#2997ff]">
                        함께 묶인 기사 {cluster.articles.length - 1}건
                      </summary>
                      <ul className="mt-3 space-y-2">
                        {cluster.articles.slice(1).map((article) => (
                          <li key={`${article.id ?? 'original'}:${article.link}`}>
                            <Link
                              href={article.id ? `/news/${article.id}` : article.link}
                              className="block rounded-xl bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700 hover:text-[#0066cc] dark:bg-black/20 dark:text-slate-200 dark:hover:text-[#2997ff]"
                            >
                              {article.title}
                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                                {article.sourceName}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 text-slate-600 dark:border-white/15 dark:bg-white/[0.025] dark:text-slate-300">
            이 날짜의 {relevance === 'DIRECT' ? '직접 관련' : '산업 관련'} 이슈를 분석하고
            있습니다. 기사별 보기에서는 수집 원문을 먼저 확인할 수 있습니다.
          </div>
        )}
      </div>
    </main>
  );
}

function RelevanceLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? 'bg-blue-50 text-[#0066cc] ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-[#2997ff] dark:ring-blue-400/20'
          : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
      }`}
    >
      {label}
    </Link>
  );
}

function isIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
