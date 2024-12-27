import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { persona } = await request.json();

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    generate 1 random tweet. dont think too much. be chaotic.

    ideas (pick ONE randomly):
    - random thought
    - hot take
    - current mood
    - food craving
    - shower thought
    - unpopular opinion
    - random story
    - weird dream
    - conspiracy theory
    - life update
    - random confession
    - pet peeve
    - existential crisis
    - random observation
    
    RULES:
    - max 180 chars
    - typos ok
    - lowercase > uppercase
    - no hashtags
    - dont mention AI
    
    just tweet text nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a tweet that expresses your thoughts or shares something about yourself." }
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    const tweet = response.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate tweet' }, { status: 500 });
  }
} 