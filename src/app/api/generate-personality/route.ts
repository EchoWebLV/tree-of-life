import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const result = await model.generateContent([{
      text: `You are a creative character designer. You must respond with ONLY a JSON object containing two fields: personality and background. Do not include any other text in your response.

Create a character profile for: "${prompt}". Return ONLY a JSON object like this:
{
  "personality": "A detailed paragraph describing personality traits and behavior",
  "background": "A detailed paragraph describing history and origin story"
}`
    }]);

    const response = await result.response;
    const content = response.text();

    // Parse and validate the response
    try {
      const result = JSON.parse(content);
      if (!result.personality || !result.background) {
        throw new Error('Invalid response format');
      }
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating personality:', error);
    return NextResponse.json(
      { error: 'Failed to generate personality' },
      { status: 500 }
    );
  }
} 