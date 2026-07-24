export async function POST(request: Request) {
  try {
    const metric = (await request.json()) as {
      name?: unknown;
      value?: unknown;
      rating?: unknown;
      path?: unknown;
    };
    if (typeof metric.name === 'string' && typeof metric.value === 'number') {
      console.info('[web-vitals]', {
        name: metric.name,
        value: metric.value,
        rating: typeof metric.rating === 'string' ? metric.rating : undefined,
        path: typeof metric.path === 'string' ? metric.path : undefined,
      });
    }
  } catch {
    // Invalid client metrics must never affect the user-facing page.
  }
  return new Response(null, { status: 204 });
}
