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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-4 py-8 text-slate-900 transition dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 md:px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-start rounded-[32px] border border-white/80 bg-white/88 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/75 dark:shadow-[0_24px_56px_rgba(2,6,23,0.45)]">
        <div className="flex w-full items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">404 Not Found</p>
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
            className="inline-flex items-center rounded-full border border-cyan-300 bg-cyan-50 px-5 py-2.5 text-sm font-medium text-cyan-800 transition hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:border-cyan-400 dark:hover:bg-cyan-500/20"
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
