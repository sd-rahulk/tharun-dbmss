import { NextResponse } from 'next/server';
import { searchJourneys } from '@/lib/services';

export async function POST(request: Request) {
  try {
    return NextResponse.json({ success: true, results: await searchJourneys(await request.json()) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Journey search failed.' }, { status: 400 });
  }
}
