import type { MetadataRoute } from 'next';
import { getSiteUrl } from '../src/lib/siteUrl';
import { getSitemapArticleIds, getSitemapChunkCount, SITEMAP_CHUNK_SIZE } from '../src/services/sitemapService';

export async function generateSitemaps() {
  const totalChunks = await getSitemapChunkCount();
  return Array.from({ length: totalChunks }, (_, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: number | string;
}): Promise<MetadataRoute.Sitemap> {
  const sitemapId = Number(id);
  if (!Number.isInteger(sitemapId) || sitemapId < 0) {
    return [];
  }

  const siteUrl = getSiteUrl();
  const now = new Date();
  const articleIds = await getSitemapArticleIds();
  const totalChunks = await getSitemapChunkCount();

  if (sitemapId >= totalChunks) {
    return [];
  }

  const start = sitemapId * SITEMAP_CHUNK_SIZE;
  const end = start + SITEMAP_CHUNK_SIZE;
  const chunkIds = articleIds.slice(start, end);

  const entries: MetadataRoute.Sitemap = [];

  if (sitemapId === 0) {
    entries.push({
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    });
  }

  for (const articleId of chunkIds) {
    entries.push({
      url: `${siteUrl}/news/${articleId}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    });
  }

  return entries;
}
