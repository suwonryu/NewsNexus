import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { SITE_NAME } from '../../../src/lib/siteMetadata';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import { getTopic } from '../../../src/services/topics';

interface TopicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) {
    return {
      title: '주제를 찾을 수 없습니다',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: `카카오뱅크 ${topic.title} 뉴스 흐름`,
    description: topic.description.slice(0, 160),
    alternates: {
      canonical: `/topics/${topic.slug}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) {
    notFound();
  }
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/topics/${topic.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `카카오뱅크 ${topic.title} 뉴스 흐름`,
        description: topic.description,
        url: canonical,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: topic.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between gap-4 py-2">
            <Link href="/" className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
                Topic Briefing
              </p>
              <p className="mt-1 truncate text-lg font-[700] tracking-[-0.03em] text-slate-950 dark:text-white">
                {SITE_NAME}
              </p>
            </Link>
            <ThemeToggle compact />
          </header>

          <section className="mt-12 rounded-[30px] border border-white/70 bg-white/90 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-[#18181a]/90 sm:p-10">
            <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">누적 주제 분석</p>
            <h1 className="mt-3 text-4xl font-[760] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
              {topic.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              {topic.description}
            </p>
            {topic.trendSummary && (
              <div className="mt-7 rounded-2xl bg-slate-50 p-5 dark:bg-white/5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">최근 흐름</p>
                <p className="mt-2 leading-7 text-slate-800 dark:text-slate-100">
                  {topic.trendSummary}
                </p>
              </div>
            )}
          </section>

          <section className="mt-12" aria-labelledby="topic-briefings">
            <h2
              id="topic-briefings"
              className="text-2xl font-[730] tracking-[-0.035em] text-slate-950 dark:text-white"
            >
              관련 완료 브리핑
            </h2>
            <ul className="mt-5 space-y-3">
              {topic.briefings.map((briefing) => (
                <li key={briefing.date}>
                  <Link
                    href={`/briefing/${briefing.date}`}
                    className="group block rounded-[22px] border border-slate-200 bg-white/85 p-5 transition hover:border-[#0071e3]/40 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-[#2997ff]/40"
                  >
                    <time className="text-xs font-semibold text-[#0066cc] dark:text-[#2997ff]">
                      {briefing.date}
                    </time>
                    <h3 className="mt-2 text-lg font-[680] text-slate-950 group-hover:text-[#0066cc] dark:text-white dark:group-hover:text-[#2997ff]">
                      {briefing.issueTitle}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {briefing.issueSummary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
