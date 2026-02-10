const LOCAL_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[seo] NEXT_PUBLIC_SITE_URL is not set. Falling back to http://localhost:3000');
    }
    return LOCAL_SITE_URL;
  }

  return configured.replace(/\/+$/, '');
}
