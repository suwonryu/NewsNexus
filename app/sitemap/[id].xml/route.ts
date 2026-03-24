import type { NextRequest } from 'next/server';
import { getSiteUrl } from '../../../src/lib/siteUrl';
import {
  getSitemapArticleEntries,
  getSitemapChunkCount,
  SITEMAP_CHUNK_SIZE,
} from '../../../src/services/sitemapService';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) {
  const params = await context.params;
  const idParam = params.id;
  const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : undefined;
  const sitemapId = Number(id);

  if (!Number.isInteger(sitemapId) || sitemapId < 0) {
    return new Response('Not found', { status: 404 });
  }

  const totalChunks = await getSitemapChunkCount();
  if (sitemapId >= totalChunks) {
    return new Response('Not found', { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();
  const articleEntries = await getSitemapArticleEntries();
  const start = sitemapId * SITEMAP_CHUNK_SIZE;
  const end = start + SITEMAP_CHUNK_SIZE;
  const chunkEntries = articleEntries.slice(start, end);

  const urls: string[] = [];

  if (sitemapId === 0) {
    urls.push(
      `<url><loc>${escapeXml(siteUrl)}/</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    );
  }

  for (const entry of chunkEntries) {
    urls.push(
      `<url><loc>${escapeXml(siteUrl)}/news/${entry.id}</loc>${
        entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ''
      }<changefreq>daily</changefreq><priority>0.7</priority></url>`,
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;

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
