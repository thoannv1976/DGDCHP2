import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSyllabus,
  getSyllabus,
  listEvaluationsForSyllabus,
  updateSyllabus,
} from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const syl = await getSyllabus(params.id);
    if (!syl) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const evaluations = await listEvaluationsForSyllabus(params.id);
    return NextResponse.json({ syllabus: syl, evaluations });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    await updateSyllabus(params.id, body);
    const syl = await getSyllabus(params.id);
    return NextResponse.json(syl);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await deleteSyllabus(params.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
