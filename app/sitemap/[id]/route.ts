import type { NextRequest } from 'next/server';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import {
  getSitemapEntries,
  getSitemapChunkCount,
  SITEMAP_CHUNK_SIZE,
  SITEMAP_REVALIDATE_SECONDS,
} from '../../../src/services/sitemapService';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const params = await context.params;
  const idParam = params.id;
  const rawId =
    typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : undefined;
  const sitemapId = Number(rawId);

  if (!Number.isInteger(sitemapId) || sitemapId < 0) {
    return new Response('Not found', { status: 404 });
  }

  const totalChunks = await getSitemapChunkCount();
  if (sitemapId >= totalChunks) {
    return new Response('Not found', { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const sitemapEntries = await getSitemapEntries();
  const start = sitemapId * SITEMAP_CHUNK_SIZE;
  const end = start + SITEMAP_CHUNK_SIZE;
  const chunkEntries = sitemapEntries.slice(start, end);

  const urls = chunkEntries.map(
    (entry) =>
      `<url><loc>${escapeXml(siteUrl)}${entry.path}</loc>${
        entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ''
      }<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority}</priority></url>`,
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

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
