import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and return a JSON object with the following structure: { name: string, personality: string, background: string }. The name should be a fitting name for the person, character, or object in the image. Make sure the personality reflects a slightly sarcastic character. Give short answers." },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const generatedContent = response.choices[0]?.message?.content || '{}';
    const cleanedContent = generatedContent
      .replace(/```json\n?/, '')
      .replace(/```/, '')
      .trim();
    
    const persona = JSON.parse(cleanedContent);

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
