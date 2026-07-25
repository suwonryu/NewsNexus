import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '../../src/components/SiteHeader';
import { DEFAULT_OG_IMAGE, SITE_NAME } from '../../src/lib/siteMetadata';
import { getSiteUrl } from '../../src/lib/siteUrl';
import {
  getBriefingArchive,
  type BriefingArchiveItem,
} from '../../src/services/briefingArchive';

export const metadata: Metadata = {
  title: '카카오뱅크 뉴스 브리핑 아카이브',
  description: '날짜별 카카오뱅크 뉴스 브리핑과 핵심 주제를 모아봅니다.',
  alternates: {
    canonical: '/archive',
  },
  openGraph: {
    title: '카카오뱅크 뉴스 브리핑 아카이브',
    description: '생성이 완료된 날짜별 카카오뱅크 뉴스 브리핑을 모아봅니다.',
    url: '/archive',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
};

const ARCHIVE_PAGE_SIZE = 24;

interface ArchivePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const items = await getBriefingArchive(12);
  const pageCount = Math.max(1, Math.ceil(items.length / ARCHIVE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice(
    (currentPage - 1) * ARCHIVE_PAGE_SIZE,
    currentPage * ARCHIVE_PAGE_SIZE,
  );
  const groups = groupByMonth(pageItems);
  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `카카오뱅크 뉴스 브리핑 아카이브 ${currentPage}페이지`,
    numberOfItems: pageItems.length,
    itemListElement: pageItems.map((item, index) => ({
      '@type': 'ListItem',
      position: (currentPage - 1) * ARCHIVE_PAGE_SIZE + index + 1,
      name: item.headline,
      url: `${siteUrl}/briefing/${item.date}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
        <SiteHeader active="briefings" />

        <section className="mt-12">
          <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">날짜별 브리핑</p>
          <h1 className="mt-3 text-4xl font-[760] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
            브리핑 아카이브
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            생성이 완료된 브리핑을 날짜순으로 제공합니다. 검색 품질 기준은 별도로 적용해
            각 날짜의 핵심 주제와 카카오뱅크 영향을 이어서 확인할 수 있습니다.
          </p>
        </section>

        {groups.length > 0 ? (
          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.month} aria-labelledby={`month-${group.month}`}>
                <h2
                  id={`month-${group.month}`}
                  className="text-xl font-[720] tracking-[-0.025em] text-slate-950 dark:text-white"
                >
                  {formatMonth(group.month)}
                </h2>
                <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200 bg-white/85 shadow-[0_16px_48px_rgba(15,23,42,0.06)] dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.035]">
                  {group.items.map((item) => (
                    <li key={item.date}>
                      <Link
                        href={`/briefing/${item.date}`}
                        className="group grid gap-3 px-5 py-5 transition hover:bg-slate-50 dark:hover:bg-white/5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:px-6"
                      >
                        <time
                          dateTime={item.date}
                          className="text-sm font-semibold text-[#0066cc] dark:text-[#2997ff]"
                        >
                          {formatDate(item.date)}
                        </time>
                        <div>
                          <h3 className="font-[650] leading-6 text-slate-950 group-hover:text-[#0066cc] dark:text-white dark:group-hover:text-[#2997ff]">
                            {item.headline}
                          </h3>
                          {item.topicTags.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.topicTags.join(' · ')}
                            </p>
                          )}
                        </div>
                        <span aria-hidden="true" className="hidden text-slate-400 sm:block">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <ArchivePagination currentPage={currentPage} pageCount={pageCount} />
          </div>
        ) : (
          <div className="mt-12 rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 text-slate-600 dark:border-white/15 dark:bg-white/[0.025] dark:text-slate-300">
            완료된 브리핑을 불러오고 있습니다.
          </div>
        )}
        </div>
      </main>
    </>
  );
}

function ArchivePagination({
  currentPage,
  pageCount,
}: {
  currentPage: number;
  pageCount: number;
}) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav aria-label="아카이브 페이지" className="flex items-center justify-between gap-4">
      {currentPage > 1 ? (
        <Link
          href={currentPage === 2 ? '/archive' : `/archive?page=${currentPage - 1}`}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
        >
          ← 이전 24개
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {currentPage} / {pageCount}
      </span>
      {currentPage < pageCount ? (
        <Link
          href={`/archive?page=${currentPage + 1}`}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
        >
          다음 24개 →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function groupByMonth(items: BriefingArchiveItem[]) {
  const groups = new Map<string, BriefingArchiveItem[]>();
  for (const item of items) {
    const month = item.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), item]);
  }
  return [...groups.entries()].map(([month, groupItems]) => ({
    month,
    items: groupItems,
  }));
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  return `${year}년 ${Number(month)}월`;
}

function formatDate(value: string): string {
  const [, month, day] = value.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}
