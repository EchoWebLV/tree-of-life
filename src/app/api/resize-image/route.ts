import { NextResponse } from 'next/server';
import { resizeImage } from '@/app/utils/imageProcessing';

export async function POST(request: Request) {
  try {
    const buffer = await request.arrayBuffer();
    const resizedBuffer = await resizeImage(buffer);
    
    return new NextResponse(resizedBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error('Error resizing image:', error);
    return NextResponse.json(
      { error: 'Failed to resize image' },
      { status: 500 }
    );
  }
} 