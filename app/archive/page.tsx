import type { Metadata } from 'next';
import Link from 'next/link';
import { DEFAULT_OG_IMAGE, SITE_NAME } from '../../src/lib/siteMetadata';
import { getSiteUrl } from '../../src/lib/siteUrl';
import {
  getBriefingArchive,
  type BriefingArchiveItem,
} from '../../src/services/briefingArchive';

export const metadata: Metadata = {
  title: '지난 카카오뱅크 뉴스 브리핑',
  description: '놓친 카카오뱅크 이슈와 주요 뉴스의 흐름을 날짜별로 다시 살펴보세요.',
  alternates: {
    canonical: '/archive',
  },
  openGraph: {
    title: '지난 카카오뱅크 뉴스 브리핑',
    description: '놓친 카카오뱅크 이슈와 주요 뉴스의 흐름을 날짜별로 다시 살펴보세요.',
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
    name: `지난 카카오뱅크 뉴스 브리핑 ${currentPage}페이지`,
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
        <div className="site-container">
          <section className="mt-12">
            <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">날짜별 브리핑</p>
            <h1 className="mt-3 text-4xl font-[760] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
              지난 브리핑
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              놓친 이슈를 날짜별로 다시 만나보세요. 카카오뱅크를 둘러싼 변화가 어떻게
              이어졌는지 한눈에 살펴볼 수 있습니다.
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
              아직 둘러볼 수 있는 지난 브리핑이 없어요. 새로운 소식은 오늘 페이지에서 먼저 만나보세요.
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
    <nav aria-label="지난 브리핑 페이지" className="flex items-center justify-between gap-4">
      {currentPage > 1 ? (
        <Link
          href={currentPage === 2 ? '/archive' : `/archive?page=${currentPage - 1}`}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
        >
          ← 이전 브리핑
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
          다음 브리핑 →
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
