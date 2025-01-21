import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { persona } = await request.json();

    // Fetch recent chat messages for context
    const recentMessages = await prisma.message.findMany({
      where: { botId: persona.id },
      orderBy: { createdAt: 'desc' },
      take: 25, // Get last 25 messages (about 12-13 conversation turns) for richer context
      select: {
        role: true,
        content: true,
      },
    });

    // Reverse messages to get chronological order
    const chatHistory = recentMessages.reverse();

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    Here is your recent chat history for context (last ~12 conversations):
    ${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

    Based on your personality and these recent conversations, generate 1 random tweet. Use this context to make your tweet more personal and connected to your recent interactions, but don't be too obvious about referencing specific conversations. be chaotic and natural.

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
    - reference your recent conversations if relevant
    
    just tweet text nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a tweet that expresses your thoughts or shares something about yourself, possibly referencing your recent conversations if relevant." }
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