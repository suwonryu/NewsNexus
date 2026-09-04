import { getSiteUrl } from '../../src/lib/siteUrl';
import {
  getSitemapEntries,
  SITEMAP_CHUNK_SIZE,
  getArticleSitemapMonths,
  SITEMAP_REVALIDATE_SECONDS,
} from '../../src/services/sitemapService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return await renderSitemapIndex();
  } catch {
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }
}

async function renderSitemapIndex() {
  const siteUrl = getSiteUrl();
  const entries = await getSitemapEntries();
  const totalChunks = Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));
  const articleMonths = await getArticleSitemapMonths(entries);

  const ids = [
    ...Array.from({ length: totalChunks }, (_, id) => String(id)),
    ...articleMonths.map((month) => `articles-${month}`),
  ];
  const chunks = ids.map((id) => {
    const url = `${siteUrl}/sitemap/${id}`;
    return `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`;
  }).join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${chunks}</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
