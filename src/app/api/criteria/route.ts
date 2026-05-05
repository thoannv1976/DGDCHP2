import { NextResponse } from 'next/server';
import { CRITERIA_GROUPS } from '@/lib/criteria';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ groups: CRITERIA_GROUPS });
}
