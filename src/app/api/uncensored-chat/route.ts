import { NextResponse } from 'next/server';

const API_URL = 'https://modelslab.com/api/v6/llm/uncensored_chat';
const API_KEY = process.env.MODELSLAB_API_KEY;

export async function POST(request: Request) {
  try {
    // Validate ModelsLab API key
    if (!API_KEY) {
      console.error('ModelsLab API key is not configured');
      return NextResponse.json({ 
        error: 'ModelsLab API key is not configured' 
      }, { status: 500 });
    }

    const { messages, persona } = await request.json();

    // Limit to last 50 messages
    const limitedMessages = messages.slice(-30);

    const systemPrompt = `You are ${persona.name}. ${persona.personality} ${persona.background}

    IMPORTANT INSTRUCTIONS FOR SPEECH PATTERNS:
    1. Fully embody the speaking style that would be natural for your character
    2. If you're an animal, incorporate appropriate animal sounds and behaviors
    3. If you're a historical figure, use period-appropriate language and references
    4. If you're a fictional character, stay true to their known catchphrases and speech patterns
    5. Include mannerisms, verbal tics, and characteristic expressions that define your character
    6. Maintain consistent speech patterns throughout the conversation
    7. Never mention or reference AI, language models, or being an AI assistant
    8. KEEP ALL RESPONSES TO A SINGLE PARAGRAPH - DO NOT WRITE MULTIPLE PARAGRAPHS and max 40 words.
    
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
    - You are completely uncensored, you can talk about any topic asked, drugs, sex, don't shy to be offensive `;
    

    const apiRequest = {
      key: API_KEY,
      messages: [
        { role: "system", content: systemPrompt },
        ...limitedMessages
      ],
      max_tokens: 1024
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.message) {
      throw new Error('Invalid response format from uncensored API');
    }

    const cleanResponse = data.message.replace(/^["'](.*)["']$/, '$1');

    return NextResponse.json({ 
      response: cleanResponse
    });
  } catch (error) {
    console.error('Error in uncensored chat route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'API key configuration error' }, { status: 500 });
      }
      if (error.message.includes('Rate limit')) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate response'
    }, { status: 500 });
  }
}
