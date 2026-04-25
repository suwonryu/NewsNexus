import type { Metadata } from 'next';
import App from '../src/App';
import { getKoreaIsoDate } from '../src/lib/koreaDate';
import { SITE_DESCRIPTION, SITE_NAME } from '../src/lib/siteMetadata';
import { getSiteUrl } from '../src/lib/siteUrl';
import { getArticlesByDate, getDateTree } from '../src/services/articleServerApi';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function Page() {
  const selectedDate = getKoreaIsoDate();
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
