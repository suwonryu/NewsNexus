import type { Metadata } from 'next';
import { NewsHome } from '../src/components/home/NewsHome';
import { getKoreaIsoDate } from '../src/lib/koreaDate';
import { SITE_DESCRIPTION, SITE_NAME } from '../src/lib/siteMetadata';
import { getSiteUrl } from '../src/lib/siteUrl';
import { getArticlesByDate } from '../src/services/articleServerApi';
import { isLowValueContent } from '../src/services/contentQuality';
import { getHomeData } from '../src/services/home';
import { getPublishedTopics } from '../src/services/topics';

export const metadata: Metadata = {
  title: '카카오뱅크 뉴스 브리핑과 주요 이슈',
  description:
    '카카오뱅크 관련 뉴스를 이슈별로 묶고, 직접 영향과 다음 관찰 포인트를 매일 브리핑합니다.',
  alternates: {
    canonical: 'https://news.kabang.app/',
  },
  openGraph: {
    title: '카카오뱅크 뉴스 브리핑과 주요 이슈',
    description:
      '카카오뱅크 관련 뉴스를 이슈별로 묶고, 직접 영향과 다음 관찰 포인트를 매일 브리핑합니다.',
    url: 'https://news.kabang.app/',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
};

export default async function Page() {
  const selectedDate = getKoreaIsoDate();
  const [home, response, topics] = await Promise.all([
    getHomeData(),
    getArticlesByDate(selectedDate, null),
    getPublishedTopics(),
  ]);
  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'ko-KR',
        url: `${siteUrl}/`,
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${siteUrl}/`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NewsHome
        home={home}
        recentArticles={response.items.filter(
          (article) => !isLowValueContent(article.title),
        )}
        publishedTopicSlugs={topics.map((topic) => topic.slug)}
      />
    </>
  );
}
