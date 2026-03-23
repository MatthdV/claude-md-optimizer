import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${process.env.LLM_API_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch models');

    const data = await res.json() as { data: { id: string }[] };

    const models = data.data.map((m) => ({
      id: m.id,
      name: m.id,
    }));

    return NextResponse.json({
      models,
      default: process.env.LLM_DEFAULT_MODEL ?? models[0]?.id ?? 'gpt-4o',
    });
  } catch {
    return NextResponse.json({
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      ],
      default: process.env.LLM_DEFAULT_MODEL ?? 'gpt-4o',
    });
  }
}
