import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { id } = await context.params;
  
  try {
    const { isAutonomous, tweetFrequencyMinutes } = await request.json();
    
    if (typeof isAutonomous !== 'boolean' || typeof tweetFrequencyMinutes !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    if (tweetFrequencyMinutes < 6 || tweetFrequencyMinutes > 1440) { // 6 minutes to 24 hours
      return NextResponse.json(
        { error: 'Tweet frequency must be between 6 minutes and 24 hours' },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.update({
      where: { id },
      data: {
        isAutonomous,
        tweetFrequencyMinutes,
      },
    });

    // Notify bot server of settings change
    try {
      const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3001';
      const url = BOT_SERVER_URL.startsWith('http') ? BOT_SERVER_URL : `https://${BOT_SERVER_URL}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${url}/refresh-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botId: id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Bot server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to notify bot server:', error);
      // Continue anyway - the bot update was successful
    }

    return NextResponse.json({ success: true, bot });
  } catch (error) {
    console.error('Error updating autonomous settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 