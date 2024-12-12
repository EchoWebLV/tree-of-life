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
            { type: "text", text: "Create a detailed persona based on this image. Include a name, personality traits, and brief background story." },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    // Parse the response from OpenAI
    const generatedContent = response.choices[0]?.message?.content || '';
    
    // You might want to parse the generated content into structured data
    // This is a simple example - you might need more sophisticated parsing
    const persona = {
      name: "Generated from AI",
      personality: generatedContent,
      background: "Generated background",
    };

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
