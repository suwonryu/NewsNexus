import { NextResponse } from 'next/server';
import { getMockDateTree } from '../../../../src/services/mockArticleData';

export async function GET() {
  return NextResponse.json(getMockDateTree());
}
