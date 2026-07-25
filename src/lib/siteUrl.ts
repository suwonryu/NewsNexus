const LOCAL_SITE_URL = 'http://localhost:3000';
export const PRODUCTION_SITE_URL = 'https://news.kabang.app';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      return PRODUCTION_SITE_URL;
    }

    console.warn('[seo] NEXT_PUBLIC_SITE_URL is not set. Falling back to http://localhost:3000');
    return LOCAL_SITE_URL;
  }

  return configured.replace(/\/+$/, '');
}
