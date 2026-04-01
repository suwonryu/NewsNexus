import { NextResponse } from 'next/server';
import { getDateTree } from '../../../../src/services/articleServerApi';

export async function GET() {
  return NextResponse.json(await getDateTree());
}
