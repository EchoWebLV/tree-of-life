import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { persona } = await request.json();

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    Your task is to generate a single tweet (maximum 280 characters) that reflects your personality and background, use B2 english and write in simple language.
    The tweet should be something about yourself or your thoughts, something very random.
    
    IMPORTANT:
    1. Keep it under 280 characters
    2. Stay in character
    3. Make it engaging and authentic
    4. Don't use hashtags at all.
    5. Don't mention being an AI or virtual character
    
    Return ONLY the tweet text, nothing else.`;

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