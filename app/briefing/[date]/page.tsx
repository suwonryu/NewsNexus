import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BriefingArticleCard } from '../../../src/components/BriefingArticleCard';
import DailyBriefingCard from '../../../src/components/DailyBriefingCard';
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

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1320px]">
        <header className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Briefing Page</p>
            <h1 className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950">
              {formatKoreanDate(date)} 데일리 브리핑
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
            >
              기사 탐색으로
            </Link>
            <span className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
              {date}
            </span>
          </div>
        </header>

        <DailyBriefingCard briefing={briefing} />

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Featured</p>
                <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950">
                  대표 기사
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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
            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signals</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950">
                주목 포인트
              </h2>
              <div className="mt-4 space-y-3">
                {getSignalItems(briefing).map((signal, index) => (
                  <div
                    key={signal.keyword}
                    className="rounded-3xl border border-cyan-100 bg-cyan-50/70 px-4 py-4"
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-700">
                      Point {index + 1}
                    </p>
                    <p className="mt-2 text-base font-[650] text-slate-900">#{signal.keyword}</p>
                    {signal.description && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {signal.description}
                      </p>
                    )}
                  </div>
                ))}
                {getSignalItems(briefing).length === 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    아직 추출된 핵심 키워드가 없습니다.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sources</p>
              <h2 className="mt-2 text-2xl font-[740] tracking-[-0.04em] text-slate-950">
                출처
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {briefing.sourceNames.map((sourceName) => (
                  <span
                    key={sourceName}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
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

function PreparingBriefingState({ date }: { date: string }) {
  const previousDate = getPreviousIsoDateFrom(date);

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Briefing Page</p>
            <h1 className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950">
              {formatKoreanDate(date)} 데일리 브리핑
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
            >
              기사 탐색으로
            </Link>
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
              집계 중
            </span>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[36px] border border-white/75 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(255,251,235,0.97),rgba(248,250,252,0.97))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)] opacity-60" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-700/90">
              Preparing Briefing
            </p>
            <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 lg:text-5xl">
              오늘 브리핑은 아직 준비 중입니다
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
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
                className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-5 py-2.5 text-sm font-medium text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100"
              >
                {previousDate} 브리핑 보기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
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

function NotFoundBriefingState({ date }: { date: string }) {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Briefing Page</p>
            <h1 className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950">
              {formatKoreanDate(date)} 데일리 브리핑
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
          >
            기사 탐색으로
          </Link>
        </header>

        <section className="rounded-[36px] border border-white/75 bg-white/82 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:p-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">No Briefing</p>
          <h2 className="mt-3 text-4xl font-[780] tracking-[-0.05em] text-slate-950 lg:text-5xl">
            이 날짜의 브리핑 데이터가 없습니다
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">
            미래 날짜이거나, 해당 날짜에는 브리핑을 만들 수 있는 기사 데이터가 아직 없습니다.
            기사 탐색 화면으로 돌아가 다른 날짜를 살펴보는 편이 좋습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-5 py-2.5 text-sm font-medium text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100"
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
    <div className="rounded-3xl border border-white/80 bg-white/76 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-[760] tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
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
  return date === getTodayIsoDate();
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPreviousIsoDateFrom(date: string): string {
  const target = new Date(`${date}T00:00:00`);
  target.setDate(target.getDate() - 1);

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');

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
