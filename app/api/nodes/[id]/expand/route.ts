import { NextResponse } from 'next/server';
import { mockExpandQuestions } from '@/lib/ai';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const { parentTitle } = body as { parentTitle?: string };
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Node id is required' }, { status: 400 });
  }
  const payload = mockExpandQuestions(id, parentTitle);
  return NextResponse.json(payload);
}
