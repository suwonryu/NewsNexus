import { NextResponse } from 'next/server';
import { getHomeData } from '../../../src/services/home';

export const revalidate = 60;

export async function GET() {
  return NextResponse.json(await getHomeData(), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
