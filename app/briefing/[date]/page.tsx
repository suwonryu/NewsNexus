import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { BriefingArticleCard } from '../../../src/components/BriefingArticleCard';
import DailyBriefingCard from '../../../src/components/DailyBriefingCard';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { getKoreaIsoDate } from '../../../src/lib/koreaDate';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
} from '../../../src/lib/siteMetadata';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import type { DailyBriefingResponse } from '../../../src/services/dailyBriefing';
import { getDailyBriefing } from '../../../src/services/articleServerApi';
import type { IsoDate } from '../../../src/types/article';

interface BriefingPageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: BriefingPageProps): Promise<Metadata> {
  const { date } = await params;
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/briefing/${date}`;

  if (!isValidIsoDate(date)) {
    return {
      title: '브리핑을 찾을 수 없습니다',
      description: '요청한 날짜의 브리핑 페이지를 찾을 수 없습니다.',
      alternates: { canonical },
      openGraph: buildBriefingOpenGraph({
        title: '브리핑을 찾을 수 없습니다',
        description: '요청한 날짜의 브리핑 페이지를 찾을 수 없습니다.',
        canonical,
      }),
      twitter: buildTwitterMetadata(
        '브리핑을 찾을 수 없습니다',
        '요청한 날짜의 브리핑 페이지를 찾을 수 없습니다.',
      ),
      robots: { index: false, follow: false },
    };
  }

  const briefing = await getDailyBriefing(date);

  if (briefing.status === 'PREPARING') {
    return {
      title: `${date} 브리핑 준비 중`,
      description: `${formatKoreanDate(date)} 브리핑은 아직 집계 중입니다.`,
      alternates: { canonical },
      openGraph: buildBriefingOpenGraph({
        title: `${date} 브리핑 준비 중`,
        description: `${formatKoreanDate(date)} 브리핑은 아직 집계 중입니다.`,
        canonical,
      }),
      twitter: buildTwitterMetadata(
        `${date} 브리핑 준비 중`,
        `${formatKoreanDate(date)} 브리핑은 아직 집계 중입니다.`,
      ),
      robots: { index: false, follow: false },
    };
  }

  if (briefing.status === 'NOT_FOUND') {
    return {
      title: `${date} 브리핑을 찾을 수 없습니다`,
      description: `${formatKoreanDate(date)} 브리핑 데이터가 없습니다.`,
      alternates: { canonical },
      openGraph: buildBriefingOpenGraph({
        title: `${date} 브리핑을 찾을 수 없습니다`,
        description: `${formatKoreanDate(date)} 브리핑 데이터가 없습니다.`,
        canonical,
      }),
      twitter: buildTwitterMetadata(
        `${date} 브리핑을 찾을 수 없습니다`,
        `${formatKoreanDate(date)} 브리핑 데이터가 없습니다.`,
      ),
      robots: { index: false, follow: false },
    };
  }

  const description = getMetaDescription(briefing.summary);

  return {
    title: `${date} 브리핑`,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      ...buildBriefingOpenGraph({
        title: `${date} 브리핑`,
        description,
        canonical,
      }),
    },
    twitter: buildTwitterMetadata(`${date} 브리핑`, description),
  };
}

export default async function BriefingPage({ params }: BriefingPageProps) {
  const { date } = await params;

  if (!isValidIsoDate(date)) {
    notFound();
  }

  const briefing = await getDailyBriefing(date);

  if (briefing.status === 'PREPARING') {
    return <PreparingBriefingState date={date} />;
  }

  if (briefing.status === 'NOT_FOUND') {
    return <NotFoundBriefingState date={date} />;
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/briefing/${date}`;
  const structuredData = buildBriefingStructuredData({ briefing, canonical, siteUrl });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
        <div className="mx-auto max-w-[1320px]">
          <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} 데일리 브리핑`}
          mobileTitle="데일리 브리핑"
          actionCount={2}
          actions={
            <>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-[#424245] dark:bg-[#272729] dark:text-slate-200 dark:hover:border-slate-600"
              >
                기사 탐색으로
              </Link>
              <span className="inline-flex items-center rounded-full border border-[#0071e3] bg-blue-50 px-4 py-2 text-sm font-medium text-[#0066cc] dark:border-[#2997ff]/60 dark:bg-blue-500/10 dark:text-[#2997ff]">
                {date}
              </span>
            </>
          }
        />

          <BriefingDateNavigation date={date} />

          <DailyBriefingCard briefing={briefing} />

          <EditorialAnalysisSection briefing={briefing} />

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Featured</p>
                <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                  대표 기사
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                상위 {briefing.featuredArticles.length}건
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {briefing.featuredArticles.map((article, index) => (
                <BriefingArticleCard
                  key={`${article.id ?? 'null'}:${article.link}`}
                  article={article}
                  index={index}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-4">
            <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Signals</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                주목 포인트
              </h2>
              <div className="mt-4 space-y-3">
                {getSignalItems(briefing).map((signal, index) => (
                  <div
                    key={signal.keyword}
                    className="rounded-[18px] border border-blue-100 bg-blue-50/70 px-4 py-4 dark:border-blue-500/20 dark:bg-blue-500/10"
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                      Point {index + 1}
                    </p>
                    <p className="mt-2 text-base font-[650] text-slate-900 dark:text-slate-50">#{signal.keyword}</p>
                    {signal.description && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {signal.description}
                      </p>
                    )}
                  </div>
                ))}
                {getSignalItems(briefing).length === 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300">
                    아직 추출된 핵심 키워드가 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sources</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                출처
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {briefing.sourceNames.map((sourceName) => (
                  <span
                    key={sourceName}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-200"
                  >
                    {sourceName}
                  </span>
                ))}
              </div>
            </section>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

function buildBriefingStructuredData({
  briefing,
  canonical,
  siteUrl,
}: {
  briefing: DailyBriefingResponse;
  canonical: string;
  siteUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${formatKoreanDate(briefing.date)} 카카오뱅크 뉴스 브리핑`,
    description: getMetaDescription(briefing.summary),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    datePublished: briefing.generatedAt ?? `${briefing.date}T23:59:59+09:00`,
    dateModified: briefing.generatedAt ?? `${briefing.date}T23:59:59+09:00`,
    image: `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`,
    inLanguage: 'ko-KR',
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    about: briefing.keywords.map((keyword) => ({
      '@type': 'Thing',
      name: keyword,
    })),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: briefing.featuredArticles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          headline: article.title,
          url: article.link,
          publisher: {
            '@type': 'Organization',
            name: article.sourceName,
          },
        },
      })),
    },
  };
}

function EditorialAnalysisSection({ briefing }: { briefing: DailyBriefingResponse }) {
  const analysis = briefing.editorialAnalysis;

  if (!analysis) {
    return null;
  }

  const details = [
    { label: '전일 대비', value: analysis.changeFromPreviousDay },
    { label: '카카오뱅크 영향', value: analysis.kakaoBankImpact },
    { label: '출처 관점', value: analysis.sourcePerspective },
    { label: '다음 관찰', value: analysis.watchPoint },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (analysis.keyChanges.length === 0 && details.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 border-y border-slate-200 py-6 dark:border-slate-700">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Editorial Analysis</p>
      <h2 className="mt-2 text-2xl font-[740] text-slate-950 dark:text-slate-50">편집 분석</h2>

      {analysis.keyChanges.length > 0 && (
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {analysis.keyChanges.map((item, index) => (
            <li key={item} className="border-l-2 border-blue-500 pl-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
              <span className="mr-2 text-xs font-semibold text-blue-700 dark:text-blue-300">0{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      )}

      {details.length > 0 && (
        <dl className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{detail.label}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function BriefingDateNavigation({ date }: { date: string }) {
  const previousDate = getPreviousIsoDateFrom(date);
  const nextDate = getNextIsoDateFrom(date);

  return (
    <nav
      aria-label="브리핑 날짜 이동"
      className="mb-4 flex items-center justify-between border-y border-slate-200 py-3 dark:border-slate-700"
    >
      <Link
        href={`/briefing/${previousDate}`}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-[#0066cc] dark:text-slate-200 dark:hover:text-[#2997ff]"
      >
        <span aria-hidden="true">&larr;</span>
        <span>이전 날짜</span>
      </Link>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{date}</span>
      <Link
        href={`/briefing/${nextDate}`}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-[#0066cc] dark:text-slate-200 dark:hover:text-[#2997ff]"
      >
        <span>다음 날짜</span>
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </nav>
  );
}

function buildBriefingOpenGraph({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical: string;
}): NonNullable<Metadata['openGraph']> {
  return {
    title,
    description,
    url: canonical,
    type: 'article',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    images: [DEFAULT_OG_IMAGE],
  };
}

function buildTwitterMetadata(
  title: string,
  description: string,
): NonNullable<Metadata['twitter']> {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [DEFAULT_OG_IMAGE_PATH],
  };
}

function PreparingBriefingState({
  date,
}: {
  date: string;
}) {
  const previousDate = getPreviousIsoDateFrom(date);

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1120px]">
        <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} 데일리 브리핑`}
          mobileTitle="브리핑 준비 중"
          actionCount={2}
          actions={
            <>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
              >
                기사 탐색으로
              </Link>
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                집계 중
              </span>
            </>
          }
        />

        <section className="relative overflow-hidden rounded-[28px] border border-[#d2d2d7] bg-white p-6 shadow-[0_10px_34px_rgba(0,0,0,0.07)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_24px_58px_rgba(0,0,0,0.42)] lg:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80 dark:bg-white/10" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-700/90 dark:text-amber-200/90">
              Preparing Briefing
            </p>
            <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 lg:text-5xl">
              오늘 브리핑은 아직 준비 중입니다
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-200">
              오늘 브리핑은 현재 기사 수집과 분석이 진행 중이어서 아직 제공되지 않습니다.
              브리핑은 하루 단위 집계가 마무리된 뒤 순차적으로 공개됩니다.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatusCard
                label="상태"
                value="준비 중"
                description="오늘자 기사 데이터가 집계되고 있습니다."
              />
              <StatusCard
                label="브리핑 공개"
                value="집계 완료 후"
                description="분석이 완료되면 오늘 브리핑을 확인할 수 있습니다."
              />
              <StatusCard
                label="추천 보기"
                value="어제 브리핑"
                description="완성된 하루 요약은 이전 날짜 브리핑에서 확인할 수 있습니다."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/briefing/${previousDate}`}
                className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
              >
                {previousDate} 브리핑 보기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600"
              >
                기사 탐색으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NotFoundBriefingState({
  date,
}: {
  date: string;
}) {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1120px]">
        <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} 데일리 브리핑`}
          mobileTitle="브리핑 없음"
          actionCount={1}
          actions={
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
            >
              기사 탐색으로
            </Link>
          }
        />

        <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_10px_34px_rgba(0,0,0,0.07)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_24px_58px_rgba(0,0,0,0.42)] lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">No Briefing</p>
          <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 lg:text-5xl">
            이 날짜의 브리핑 데이터가 없습니다
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-300">
            미래 날짜이거나, 해당 날짜에는 브리핑을 만들 수 있는 기사 데이터가 아직 없습니다.
            기사 탐색 화면으로 돌아가 다른 날짜를 살펴보는 편이 좋습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
            >
              기사 탐색으로 이동
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}


function StatusCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-4 dark:border-[#424245] dark:bg-[#272729]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function BriefingHeader({
  desktopEyebrow,
  mobileEyebrow,
  desktopTitle,
  mobileTitle,
  actions,
  actionCount,
}: {
  desktopEyebrow: string;
  mobileEyebrow: string;
  desktopTitle: string;
  mobileTitle: string;
  actions: ReactNode;
  actionCount: number;
}) {
  return (
    <header className="mb-4 rounded-[18px] border border-[#d2d2d7] bg-white/95 px-5 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)] md:rounded-[28px]">
      <div className="md:flex md:items-center md:justify-between md:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.14em] text-slate-500 dark:text-slate-400 md:uppercase md:tracking-[0.18em]">
              <span className="md:hidden">{mobileEyebrow}</span>
              <span className="hidden md:inline">{desktopEyebrow}</span>
            </p>
            <h1 className="mt-2 text-lg font-[650] tracking-[-0.03em] text-slate-950 dark:text-slate-50 md:text-2xl md:font-[760] md:tracking-[-0.04em]">
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">{desktopTitle}</span>
            </h1>
          </div>
          <div className="md:hidden">
            <ThemeToggle compact />
          </div>
        </div>

        <div className="mt-3 hidden flex-wrap items-center gap-2 md:mt-0 md:flex md:justify-end">
          <ThemeToggle compact />
          {actions}
        </div>
      </div>

      <div
        className={`mt-3 flex flex-wrap items-center gap-2 md:hidden ${
          actionCount > 1 ? 'justify-between' : 'justify-start'
        }`}
      >
        {actions}
      </div>
    </header>
  );
}

function isIsoDate(value: string): value is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidIsoDate(value: string): value is IsoDate {
  if (!isIsoDate(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function isCurrentIsoDate(date: string): boolean {
  return date === getKoreaIsoDate();
}

function getPreviousIsoDateFrom(date: string): string {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() - 1);

  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, '0');
  const day = String(target.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getNextIsoDateFrom(date: string): string {
  const target = new Date(`${date}T00:00:00Z`);
  target.setUTCDate(target.getUTCDate() + 1);

  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, '0');
  const day = String(target.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatKoreanDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${year}년 ${month}월 ${day}일`;
}

function getSignalItems(briefing: DailyBriefingResponse) {
  if (briefing.keywordDetails && briefing.keywordDetails.length > 0) {
    return briefing.keywordDetails.slice(0, 3);
  }

  return briefing.keywords.slice(0, 3).map((keyword) => ({
    keyword,
    description: '',
  }));
}

function getMetaDescription(summary: string | null): string {
  if (!summary) {
    return '카카오뱅크 뉴스 브리핑';
  }

  const normalized = summary.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '카카오뱅크 뉴스 브리핑';
  }

  return normalized.slice(0, 160);
}
