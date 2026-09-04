import type { NextRequest } from 'next/server';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import {
  getSitemapEntries,
  getArticleSitemapMonths,
  getArticleSitemapEntries,
  SITEMAP_CHUNK_SIZE,
  SITEMAP_REVALIDATE_SECONDS,
} from '../../../src/services/sitemapService';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    return await renderSitemap(context);
  } catch {
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '300' },
    });
  }
}

async function renderSitemap(
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const params = await context.params;
  const idParam = params.id;
  const rawId =
    typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : undefined;
  const month = rawId?.match(/^articles-(\d{4}-(?:0[1-9]|1[0-2]))$/)?.[1];
  if (!month && (!rawId || !/^(0|[1-9]\d*)$/.test(rawId))) {
    return new Response('Not found', { status: 404 });
  }
  let chunkEntries;
  if (month) {
    if (!(await getArticleSitemapMonths()).includes(month)) {
      return new Response('Not found', { status: 404 });
    }
    chunkEntries = await getArticleSitemapEntries(month);
  } else {
    const sitemapEntries = await getSitemapEntries();
    const sitemapId = Number(rawId);
    if (!Number.isSafeInteger(sitemapId) || sitemapId >= Math.max(1, Math.ceil(sitemapEntries.length / SITEMAP_CHUNK_SIZE))) {
      return new Response('Not found', { status: 404 });
    }
    chunkEntries = sitemapEntries.slice(sitemapId * SITEMAP_CHUNK_SIZE, (sitemapId + 1) * SITEMAP_CHUNK_SIZE);
  }

  const siteUrl = getSiteUrl();

  const urls = chunkEntries.map(
    (entry) =>
      `<url><loc>${escapeXml(`${siteUrl}${entry.path}`)}</loc>${
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
