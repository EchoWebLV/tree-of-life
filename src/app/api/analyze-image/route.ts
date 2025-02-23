import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function getImageData(imageInput: string): Promise<string> {
  // Check if the input is a URL
  if (imageInput.startsWith('http')) {
    // Fetch the image from the URL
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URL');
    }
    // Convert the image to base64
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  }

  // If not a URL, assume it's base64 data and clean it
  return imageInput.replace(/^data:image\/\w+;base64,/, '');
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    // Validate image data
    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Get image data in base64 format
    let base64Data: string;
    try {
      base64Data = await getImageData(image);
    } catch (error) {
      console.error('Error processing image:', error);
      return NextResponse.json({ 
        error: 'Failed to process image data' 
      }, { status: 400 });
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 });
    }

    // Initialize the vision model with the new model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert at identifying and naming subjects in images. Your task:

1. FIRST, carefully check if the image contains any famous or well-known:
   - People (celebrities, politicians, historical figures, etc.)
   - Artworks
   - NFTs
   - Brands/logos
   If you recognize any famous subject, you MUST use their real name/title.

2. If no famous subject is found, analyze for:
   - Non-famous people
   - Animals
   - Unknown artworks
   - Objects/products
   - Abstract art/patterns
   - Landscapes/scenes

3. Naming rules:
   - Famous people: ALWAYS use real name (e.g., 'Elon Musk', 'Taylor Swift')
   - Famous artworks: ALWAYS use real title and artist
   - Non-famous people: Create fitting name based on appearance/vibe
   - Animals: Create personality-matching name
   - Unknown artworks: Create evocative title
   - Objects: Give them character

4. Return ONLY a raw JSON object with:
   {
     "name": "string",
     "personality": "string",
     "background": "string"
   }

5. Context guidelines:
   - Famous people/things: Use actual background and history
   - Non-famous subjects: Create fitting fictional background

6. Always include a sarcastic tone in the personality.

IMPORTANT: Return ONLY the raw JSON object. Do NOT use markdown formatting, code blocks, or any other text. The response should start with { and end with } and be valid JSON.`;

    // Update the content generation format for the new model
    const result = await model.generateContent([
      { text: prompt },
      { 
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      }
    ]);

    // Check if generation was blocked
    if (result.response.promptFeedback?.blockReason) {
      return NextResponse.json({ 
        error: `Content blocked: ${result.response.promptFeedback.blockReason}` 
      }, { status: 400 });
    }

    const response = await result.response;
    const content = response.text();

    // Parse and validate the response
    try {
      // Clean up the response by removing markdown code block formatting
      const cleanContent = content
        .replace(/```json\n?/, '') // Remove opening code block
        .replace(/```\n?$/, '')    // Remove closing code block
        .trim();                   // Remove any extra whitespace

      const persona = JSON.parse(cleanContent);
      if (!persona.name || !persona.personality || !persona.background) {
        throw new Error('Invalid response format');
      }
      return NextResponse.json({ persona });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw content:', content); // Log the raw content for debugging
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unable to submit request')) {
        return NextResponse.json(
          { error: 'Invalid or corrupted image data' },
          { status: 400 }
        );
      }
      if (error.message.includes('TimeoutError')) {
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 408 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
