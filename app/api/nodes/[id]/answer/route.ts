import { NextResponse } from 'next/server';
import { mockDraftAnswer } from '@/lib/ai';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const { question } = body as { question?: string };
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Node id is required' }, { status: 400 });
  }
  const payload = mockDraftAnswer(`${id}:${question ?? ''}`);
  return NextResponse.json(payload);
}
