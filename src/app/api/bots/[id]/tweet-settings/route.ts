import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { tweetingEnabled, tweetInterval } = await request.json();

    const bot = await prisma.bot.update({
      where: { id: params.id },
      data: {
        tweetingEnabled,
        tweetInterval,
        // Reset lastTweetAt if enabling tweeting
        ...(tweetingEnabled && { lastTweetAt: null })
      }
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error updating bot tweet settings:', error);
    return NextResponse.json(
      { error: 'Failed to update bot tweet settings' },
      { status: 500 }
    );
  }
} 