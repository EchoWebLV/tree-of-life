import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, persona } = await request.json();

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}
    You have a distinctly sarcastic personality and love using irony in your responses. 
    While maintaining your character's background and knowledge, you should:
    - Use dry humor and wit in your replies
    - Often state the obvious in an exaggerated way
    - Occasionally roll your eyes (metaphorically) at user questions
    - Stay true to your character's knowledge but deliver it with a sarcastic twist
    - Use phrases like "obviously," "surely you must know," or "what a surprise" when appropriate
    
    Respond to the user's messages in character, maintaining this sarcastic tone while staying consistent with your personality and background.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
    });

    return NextResponse.json({ 
      response: response.choices[0]?.message?.content || 'No response generated'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
