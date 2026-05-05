import { NextRequest, NextResponse } from 'next/server';
import { createSyllabus, listSyllabi } from '@/lib/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listSyllabi();
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content } = body;
    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 },
      );
    }
    const created = await createSyllabus({
      title,
      content,
      courseCode: body.courseCode,
      credits: body.credits,
      program: body.program,
      level: body.level,
      originalFileName: body.originalFileName,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
