import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { bot, tokenAddress } = await request.json();
    
    if (!bot) {
      return NextResponse.json(
        { error: 'Missing bot data' },
        { status: 400 }
      );
    }

    // Check if a landing page already exists for this bot
    const existingPage = await prisma.landingPage.findFirst({
      where: { botId: bot.id }
    });

    if (existingPage) {
      return NextResponse.json({
        success: true,
        landingPageUrl: `/bot/${existingPage.id}`,
        message: 'Bot is already public'
      });
    }

    // Create new landing page
    const landingPage = await prisma.landingPage.create({
      data: {
        id: crypto.randomUUID(), // Ensure we have a unique ID
        tokenAddress: tokenAddress || 'no-token',
        botId: bot.id,
        name: bot.name,
        imageUrl: bot.imageUrl,
        personality: bot.personality,
        background: bot.background,
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