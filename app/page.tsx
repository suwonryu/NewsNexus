import type { Metadata } from 'next';
import App from '../src/App';
import { SITE_DESCRIPTION, SITE_NAME } from '../src/lib/siteMetadata';
import { getSiteUrl } from '../src/lib/siteUrl';
import { getArticlesByDate, getDateTree } from '../src/services/articleServerApi';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function Page() {
  const selectedDate = getTodayIsoDate();
  const [response, dateTree] = await Promise.all([
    getArticlesByDate(selectedDate, null),
    getDateTree(),
  ]);
  const siteUrl = getSiteUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'ko-KR',
    url: `${siteUrl}/`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <App
        initialSelectedDate={selectedDate}
        initialDateTree={dateTree.years}
        initialArticles={response.items}
        initialNextCursor={response.nextCursor}
        initialHasMore={response.hasNext}
      />
    </>
  );
}
