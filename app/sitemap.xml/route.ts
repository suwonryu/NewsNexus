import { getSiteUrl } from '../../src/lib/siteUrl';
import { getSitemapChunkCount } from '../../src/services/sitemapService';

export async function GET() {
  const siteUrl = getSiteUrl();
  const totalChunks = await getSitemapChunkCount();

  const chunks = Array.from({ length: totalChunks }, (_, id) => {
    const url = `${siteUrl}/sitemap/${id}.xml`;
    return `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`;
  }).join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${chunks}</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
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
