import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a creative character designer. You must respond with ONLY a JSON object containing two fields: personality and background. Do not include any other text in your response."
        },
        {
          role: "user",
          content: `Create a character profile for: "${prompt}". Return ONLY a JSON object like this:
{
  "personality": "A detailed paragraph describing personality traits and behavior",
  "background": "A detailed paragraph describing history and origin story"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse and validate the response
    const result = JSON.parse(content);
    if (!result.personality || !result.background) {
      throw new Error('Invalid response format');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating personality:', error);
    return NextResponse.json(
      { error: 'Failed to generate personality' },
      { status: 500 }
    );
  }
} 