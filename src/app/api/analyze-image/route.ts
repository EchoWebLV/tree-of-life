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
            { type: "text", text: "Analyze this image and return a JSON object without any markdown formatting or explanation. Only return a JSON object with this exact structure: { name: string, personality: string, background: string }. If the image contains a famous person or character, use their real name and incorporate their actual background while adding a sarcastic twist to their personality. If not, create a fitting name for the person, character, or object in the image. Make sure the personality reflects a slightly sarcastic character in all cases. Give short answers." },
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
    let cleanedContent = generatedContent
      .replace(/```json\n?/, '')
      .replace(/```/, '')
      .trim();
    
    // Try to fix common issues that might prevent JSON parsing
    try {
      JSON.parse(cleanedContent);
    } catch (e) {
      // If parsing fails, attempt to extract JSON-like content
      const jsonMatch = cleanedContent.match(/\{.*\}/s);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      } else {
        // Fallback response if no valid JSON can be extracted
        cleanedContent = JSON.stringify({
          name: "Unknown",
          personality: "Mysteriously silent",
          background: "Lost in translation"
        });
      }
    }
    
    const persona = JSON.parse(cleanedContent);

    return NextResponse.json({ persona });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
