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
            { 
              type: "text", 
              text: "You are an expert at identifying people in images. Your task:\n\n1. FIRST, carefully analyze if this image contains any famous people, politicians, celebrities, or well-known figures.\n2. If you identify a famous person, you MUST use their actual name (e.g., 'Donald Trump' for Donald Trump, 'Elon Musk' for Elon Musk).\n3. Return ONLY a JSON object with this structure: { name: string, personality: string, background: string }\n4. For famous people: Use their real name, actual background, and add a witty, sarcastic personality description based on their public persona.\n5. For non-famous people: Create a fitting fictional name.\n\nNo explanations or additional text - just the JSON object." 
            },
            {
              type: "image_url",
              image_url: image,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
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
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
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
