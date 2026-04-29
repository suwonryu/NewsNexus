import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '../src/components/ThemeToggle';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '../src/lib/siteMetadata';

const NOT_FOUND_TITLE = '페이지를 찾을 수 없습니다';
const NOT_FOUND_DESCRIPTION = '요청하신 페이지가 없거나 이동되었어요. 홈에서 다시 탐색해보세요.';

export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
  description: NOT_FOUND_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `${NOT_FOUND_TITLE} | ${SITE_NAME}`,
    description: NOT_FOUND_DESCRIPTION,
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${NOT_FOUND_TITLE} | ${SITE_NAME}`,
    description: NOT_FOUND_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 transition dark:text-slate-100 md:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-start rounded-[28px] border border-[#d2d2d7] bg-white/95 p-8 shadow-[0_10px_34px_rgba(0,0,0,0.07)] dark:border-[#424245] dark:bg-[#1d1d1f] dark:shadow-[0_24px_58px_rgba(0,0,0,0.42)]">
        <div className="flex w-full items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">404 Not Found</p>
            <h1 className="mt-4 text-3xl font-[780] tracking-[-0.05em] text-slate-950 dark:text-slate-50 md:text-4xl">
              {NOT_FOUND_TITLE}
            </h1>
          </div>
          <ThemeToggle compact />
        </div>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{NOT_FOUND_DESCRIPTION}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{SITE_DESCRIPTION}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-[#0071e3] bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#0066cc] hover:bg-[#0066cc] dark:border-[#2997ff] dark:bg-[#2997ff] dark:text-black"
          >
            홈으로 이동
          </Link>
          <Link
            href="/briefing"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-600"
          >
            브리핑 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
