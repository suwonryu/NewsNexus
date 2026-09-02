export async function POST(request: Request) {
  try {
    const metric = (await request.json()) as {
      name?: unknown;
      value?: unknown;
      rating?: unknown;
      path?: unknown;
    };
    if (
      typeof metric.name === 'string' &&
      typeof metric.value === 'number' &&
      Number.isFinite(metric.value)
    ) {
      const apiRoot =
        process.env.KABANG_API_ROOT?.trim() || 'https://fury.kabang.app/v2/kabang';
      await fetch(`${apiRoot}/metrics/web-vitals`, {
        method: 'POST',
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: typeof metric.rating === 'string' ? metric.rating : undefined,
          path: typeof metric.path === 'string' ? metric.path : undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(1_500),
      });
    }
  } catch {
    // Invalid client metrics must never affect the user-facing page.
  }
  return new Response(null, { status: 204 });
}
