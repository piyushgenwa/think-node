import { NextResponse } from 'next/server';
import { mockSummarize } from '@/lib/ai';
import { Graph } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { graph } = body as { graph?: Graph };
  if (!graph) {
    return NextResponse.json({ error: 'Graph is required' }, { status: 400 });
  }
  const payload = mockSummarize(graph);
  return NextResponse.json(payload);
}
