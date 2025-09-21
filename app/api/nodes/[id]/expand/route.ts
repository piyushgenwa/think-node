import { NextResponse } from 'next/server';
import { expandQuestions } from '@/lib/ai';

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
  try {
    const payload = await expandQuestions(id, parentTitle);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Expand node error', error);
    return NextResponse.json({ error: 'Unable to expand node' }, { status: 500 });
  }
}
