import { NextResponse } from 'next/server';
import { draftAnswer } from '@/lib/ai';

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));
  const { question, notes } = body as { question?: string; notes?: string };
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Node id is required' }, { status: 400 });
  }
  if (!question || typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }
  const seed = `${id}:${question}`;
  try {
    const payload = await draftAnswer(seed, question, notes);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Draft answer error', error);
    return NextResponse.json({ error: 'Unable to draft answer' }, { status: 500 });
  }
}
