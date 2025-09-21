import { NextResponse } from 'next/server';
import { generateThemes } from '@/lib/ai';

export async function POST(request: Request) {
  const body = await request.json();
  const { topic } = body as { topic?: string };
  if (!topic || typeof topic !== 'string') {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
  }
  try {
    const payload = await generateThemes(topic.trim());
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Generate themes error', error);
    return NextResponse.json({ error: 'Unable to generate themes' }, { status: 500 });
  }
}
