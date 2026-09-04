import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { BriefingArticleCard } from '../../../src/components/BriefingArticleCard';
import DailyBriefingCard from '../../../src/components/DailyBriefingCard';
import { getKoreaIsoDate } from '../../../src/lib/koreaDate';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
} from '../../../src/lib/siteMetadata';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import type { DailyBriefingResponse } from '../../../src/services/dailyBriefing';
import { getDailyBriefing } from '../../../src/services/articleServerApi';
import { getAllReadyBriefings } from '../../../src/services/briefingArchive';
import { normalizeEditorialText } from '../../../src/services/contentPresentation';
import { getPublishedTopics } from '../../../src/services/topics';
import { getHomeData, getIssues, type HomeIssueCluster } from '../../../src/services/home';
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
      description: `${formatKoreanDate(date)}의 주요 소식을 정리하고 있습니다. 가장 최근 브리핑을 먼저 만나보세요.`,
      alternates: { canonical },
      openGraph: buildBriefingOpenGraph({
        title: `${date} 브리핑 준비 중`,
        description: `${formatKoreanDate(date)}의 주요 소식을 정리하고 있습니다. 가장 최근 브리핑을 먼저 만나보세요.`,
        canonical,
      }),
      twitter: buildTwitterMetadata(
        `${date} 브리핑 준비 중`,
        `${formatKoreanDate(date)}의 주요 소식을 정리하고 있습니다. 가장 최근 브리핑을 먼저 만나보세요.`,
      ),
      robots: { index: false, follow: true },
    };
  }

  if (briefing.status === 'NOT_FOUND') {
    return {
      title: `${date} 브리핑을 찾을 수 없습니다`,
      description: `${formatKoreanDate(date)}에는 준비된 브리핑이 없습니다. 다른 날짜의 브리핑을 둘러보세요.`,
      alternates: { canonical },
      openGraph: buildBriefingOpenGraph({
        title: `${date} 브리핑을 찾을 수 없습니다`,
        description: `${formatKoreanDate(date)}에는 준비된 브리핑이 없습니다. 다른 날짜의 브리핑을 둘러보세요.`,
        canonical,
      }),
      twitter: buildTwitterMetadata(
        `${date} 브리핑을 찾을 수 없습니다`,
        `${formatKoreanDate(date)}에는 준비된 브리핑이 없습니다. 다른 날짜의 브리핑을 둘러보세요.`,
      ),
      robots: { index: false, follow: false },
    };
  }

  const description = getMetaDescription(briefing.summary);
  const topicTitle = briefing.keywords.slice(0, 3).join('·') || '주요 이슈';
  const briefingTitle = `카카오뱅크 뉴스 브리핑 | ${topicTitle} | ${date}`;
  const hasPublishedContent = Boolean(briefing.summary?.trim());

  return {
    title: briefingTitle,
    description,
    alternates: { canonical },
    robots: { index: hasPublishedContent, follow: true },
    openGraph: {
      ...buildBriefingOpenGraph({
        title: briefingTitle,
        description,
        canonical,
      }),
    },
    twitter: buildTwitterMetadata(briefingTitle, description),
  };
}

export default async function BriefingPage({ params }: BriefingPageProps) {
  const { date } = await params;

  if (!isValidIsoDate(date)) {
    notFound();
  }

  const [briefing, issuePage] = await Promise.all([
    getDailyBriefing(date),
    getIssues(date, 'DIRECT'),
  ]);

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
        <div className="site-container">
          <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} | ${getBriefingDisplayHeadline(briefing)}`}
          mobileTitle={getBriefingDisplayHeadline(briefing)}
          actions={
            <>
              <Link
                href="/explore"
                className="inline-flex items-center rounded-full border border-[#d2d2d7] bg-[#f5f5f7] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-[#424245] dark:bg-[#272729] dark:text-slate-200 dark:hover:border-slate-600"
              >
                이슈 둘러보기
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
          <BriefingIssueSection clusters={issuePage.items} />
          <RelatedTopics date={briefing.date} />

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Further Reading</p>
                <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                  함께 읽을 기사
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {briefing.featuredArticles.length}건
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
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Watch</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                놓치지 말 것
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
                    오늘은 따로 짚어볼 키워드가 없어요.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)]">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Sources</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950 dark:text-slate-50">
                참고한 언론사
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

function BriefingIssueSection({ clusters }: { clusters: HomeIssueCluster[] }) {
  if (clusters.length === 0) {
    return null;
  }
  return (
    <section className="mt-4 border-y border-slate-200 py-6 dark:border-slate-700">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        KakaoBank Impact
      </p>
      <h2 className="mt-2 text-2xl font-[740] text-slate-950 dark:text-slate-50">
        카카오뱅크에 미치는 영향
      </h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {clusters.slice(0, 3).map((cluster) => (
          <article
            key={cluster.id}
            className="rounded-[20px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.035]"
          >
            <p className="text-xs font-semibold text-[#0066cc] dark:text-[#2997ff]">
              기사 {cluster.articleCount}건 · {cluster.sourceCount}개 매체
            </p>
            <h3 className="mt-2 text-lg font-[680] leading-7 text-slate-950 dark:text-white">
              {cluster.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {cluster.impactReason}
            </p>
            {cluster.representativeArticleId && (
              <Link
                href={`/news/${cluster.representativeArticleId}`}
                className="mt-4 inline-flex text-sm font-semibold text-[#0066cc] hover:underline dark:text-[#2997ff]"
              >
                관련 기사 보기
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

async function RelatedTopics({ date }: { date: string }) {
  const topics = (await getPublishedTopics()).filter((topic) =>
    topic.briefings.some((briefing) => briefing.date === date),
  );
  if (topics.length === 0) {
    return null;
  }
  return (
    <nav aria-label="관련 주제" className="mt-4 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        관련 주제
      </span>
      {topics.map((topic) => (
        <Link
          key={topic.slug}
          href={`/topics/${topic.slug}`}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#0071e3] hover:text-[#0066cc] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#2997ff] dark:hover:text-[#2997ff]"
        >
          {topic.title}
        </Link>
      ))}
    </nav>
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
  const featuredItemList = {
    '@type': 'ItemList',
    name: `${briefing.date} 대표 기사`,
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
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${formatKoreanDate(briefing.date)} | ${getBriefingDisplayHeadline(briefing)}`,
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
        mainEntity: featuredItemList,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '홈',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '지난 브리핑',
            item: `${siteUrl}/archive`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: briefing.date,
            item: canonical,
          },
        ],
      },
      featuredItemList,
    ],
  };
}

function EditorialAnalysisSection({ briefing }: { briefing: DailyBriefingResponse }) {
  const analysis = briefing.editorialAnalysis;

  if (!analysis) {
    return null;
  }

  const details = [
    { label: '어제와 달라진 점', value: analysis.changeFromPreviousDay },
    { label: '카카오뱅크에는', value: analysis.kakaoBankImpact },
    { label: '뉴스가 바라본 시선', value: analysis.sourcePerspective },
    { label: '앞으로 볼 것', value: analysis.watchPoint },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (analysis.keyChanges.length === 0 && details.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 border-y border-slate-200 py-6 dark:border-slate-700">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Today&apos;s View</p>
      <h2 className="mt-2 text-2xl font-[740] text-slate-950 dark:text-slate-50">오늘의 관점</h2>

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

async function BriefingDateNavigation({ date }: { date: string }) {
  const archive = await getAllReadyBriefings();
  const currentIndex = archive.findIndex((item) => item.date === date);
  const previousDate = currentIndex >= 0 ? archive[currentIndex + 1]?.date : undefined;
  const nextDate = currentIndex > 0 ? archive[currentIndex - 1]?.date : undefined;

  return (
    <nav
      aria-label="브리핑 날짜 이동"
      className="mb-4 flex items-center justify-between border-y border-slate-200 py-3 dark:border-slate-700"
    >
      {previousDate ? (
        <Link
          href={`/briefing/${previousDate}`}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-[#0066cc] dark:text-slate-200 dark:hover:text-[#2997ff]"
        >
          <span aria-hidden="true">&larr;</span>
          <span>이전 브리핑</span>
        </Link>
      ) : (
        <span className="min-w-24" aria-hidden="true" />
      )}
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{date}</span>
      {nextDate ? (
        <Link
          href={`/briefing/${nextDate}`}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-[#0066cc] dark:text-slate-200 dark:hover:text-[#2997ff]"
        >
          <span>다음 브리핑</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : (
        <span className="min-w-24" aria-hidden="true" />
      )}
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

async function PreparingBriefingState({
  date,
}: {
  date: string;
}) {
  const home = await getHomeData();
  const latestReadyDate = home.latestReadyBriefing?.date ?? getPreviousIsoDateFrom(date);

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="site-container">
        <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} 데일리 브리핑`}
          mobileTitle="오늘의 소식을 정리하고 있어요"
          actions={
            <>
              <Link
                href="/explore"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
              >
                이슈 둘러보기
              </Link>
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                새 소식 정리 중
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
              오늘의 브리핑을 준비하고 있어요
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-200">
              오늘 카카오뱅크를 둘러싼 소식을 차분히 살펴보고 있어요. 기다리는 동안 가장
              최근 브리핑이나 지난 이슈를 먼저 둘러보세요.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <StatusCard
                label="오늘 들어온 소식"
                value={`${home.collection.articleCount}건`}
                description="카카오뱅크와 금융권에서 오늘 전해진 소식이에요."
              />
              <StatusCard
                label="먼저 읽기"
                value="최근 브리핑"
                description="가장 최근 하루의 핵심 흐름을 먼저 살펴보세요."
              />
              <StatusCard
                label="함께 보기"
                value="주요 이슈"
                description="뉴스를 이슈별로 모아 흐름을 빠르게 훑어볼 수 있어요."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/briefing/${latestReadyDate}`}
                className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
              >
                {latestReadyDate} 브리핑 읽기
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600"
              >
                주요 이슈 둘러보기
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
      <div className="site-container">
        <BriefingHeader
          desktopEyebrow="Daily Briefing"
          mobileEyebrow="오늘의 카카오뱅크"
          desktopTitle={`${formatKoreanDate(date)} 데일리 브리핑`}
          mobileTitle="이날의 브리핑은 없어요"
          actions={
            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
            >
              다른 이슈 둘러보기
            </Link>
          }
        />

        <section className="rounded-[28px] border border-[#d2d2d7] bg-white/95 p-6 shadow-[0_10px_34px_rgba(0,0,0,0.07)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_24px_58px_rgba(0,0,0,0.42)] lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">No Briefing</p>
          <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 lg:text-5xl">
            이 날짜에는 브리핑이 없어요
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 dark:text-slate-300">
            다른 날짜를 골라 카카오뱅크의 주요 소식과 흐름을 살펴보세요. 최근 브리핑부터
            둘러보는 것도 좋습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
            >
              다른 날짜 둘러보기
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
}: {
  desktopEyebrow: string;
  mobileEyebrow: string;
  desktopTitle: string;
  mobileTitle: string;
  actions: ReactNode;
}) {
  return (
    <header className="mb-4 rounded-[18px] border border-[#d2d2d7] bg-white/95 px-5 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_18px_44px_rgba(0,0,0,0.36)] md:rounded-[28px]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
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

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
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

  const normalized = normalizeEditorialText(summary, 3);

  if (!normalized) {
    return '카카오뱅크 뉴스 브리핑';
  }

  return normalized.slice(0, 160);
}

function getBriefingDisplayHeadline(briefing: DailyBriefingResponse): string {
  const leadingChange = briefing.editorialAnalysis?.keyChanges?.[0];
  if (leadingChange) {
    return normalizeEditorialText(leadingChange, 1).replace(/[.!?]$/, '');
  }
  const topics = briefing.keywords.slice(0, 3).join('·');
  return topics ? `${topics} 흐름과 카카오뱅크 영향` : '주요 이슈와 카카오뱅크 영향';
}
