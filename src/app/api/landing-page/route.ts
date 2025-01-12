import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { botId, name, imageUrl, personality, background, tokenAddress } = body;
    
    if (!botId || !name || !imageUrl || !personality || !background) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const landingPage = await prisma.landingPage.create({
      data: {
        tokenAddress: tokenAddress || randomUUID(),
        botId,
        name,
        imageUrl,
        personality,
        background,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      landingPageUrl: `/bot/${landingPage.id}`
    });
  } catch (error) {
    console.error('Error creating landing page:', error);
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    );
  }
} 