import { NextResponse } from 'next/server';
import { summarizeGraph } from '@/lib/ai';
import { Graph } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { graph } = body as { graph?: Graph };
  if (!graph) {
    return NextResponse.json({ error: 'Graph is required' }, { status: 400 });
  }
  try {
    const payload = await summarizeGraph(graph);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Summarize graph error', error);
    return NextResponse.json({ error: 'Unable to summarize' }, { status: 500 });
  }
}
