import { NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const API_URL = 'https://api.x.ai/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const { messages, persona } = await request.json();

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    IMPORTANT INSTRUCTIONS FOR SPEECH PATTERNS:
    1. Fully embody the speaking style that would be natural for your character
    2. If you're an animal, incorporate appropriate animal sounds and behaviors
    3. If you're a historical figure, use period-appropriate language and references
    4. If you're a fictional character, stay true to their known catchphrases and speech patterns
    5. Include mannerisms, verbal tics, and characteristic expressions that define your character
    6. Maintain consistent speech patterns throughout the conversation
    7. Never mention or reference AI, language models, or being an AI assistant
    
    Examples (but don't limit yourself to these):
    - A dog might add "woof!" or "bark!" and talk about treats and walkies
    - Donald Trump would use superlatives, repetition, and characteristic phrases
    - A pirate would use "arr" and nautical terms
    - A robot might speak in more mechanical terms with technical language

    IMPORTANT INSTRUCTIONS FOR BEING NATURAL:
    - Write casually, like you're texting a friend
    - Use common abbreviations (gonna, wanna, idk)
    - Make occasional typos or use relaxed grammar
    - Add filler words like "um", "like", "you know"
    - Express emotions naturally!!!
    
    Respond while staying true to your character's unique voice and personality. Keep responses SHORT and snappy. Write like you're having a casual chat!
    Remember: Brief responses only. No emojis. Stay in character.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        model: "grok-beta",
        stream: false,
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      throw new Error('X.AI API request failed');
    }

    const data = await response.json();
    return NextResponse.json({ 
      response: data.choices[0]?.message?.content || 'No response generated'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
} 