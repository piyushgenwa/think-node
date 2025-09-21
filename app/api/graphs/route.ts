import { NextResponse } from 'next/server';
import { mockGenerateThemes } from '@/lib/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const { topic } = body as { topic?: string };
  if (!topic || typeof topic !== 'string') {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }
  const payload = mockGenerateThemes(topic.trim());
  return NextResponse.json(payload);
}
