import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

    // Initialize the chat model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "I understand and will embody the character as specified." }]
        }
      ],
    });

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: Message) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Send the last message to get a response
    const result = await chat.sendMessage([{
      text: geminiMessages[geminiMessages.length - 1].parts[0].text
    }]);
    const response = await result.response;

    return NextResponse.json({ 
      response: response.text() || 'No response generated'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
