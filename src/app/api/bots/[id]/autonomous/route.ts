import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface APISettings {
  crypto?: boolean;
  news?: boolean;
  weather?: boolean;
  exchange?: boolean;
  tweetPrompt?: string;
}

export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { id } = await context.params;
  
  try {
    const { isAutonomous, tweetFrequencyMinutes, tweetPrompt } = await request.json();
    console.log(`Autonomous update request for bot ${id}:`, { isAutonomous, tweetFrequencyMinutes });
    
    if (typeof isAutonomous !== 'boolean' || typeof tweetFrequencyMinutes !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    if (tweetFrequencyMinutes < 60) { // Minimum 1 hour
      return NextResponse.json(
        { error: 'Tweet frequency must be at least 1 hour (60 minutes)' },
        { status: 400 }
      );
    }

    // Update bot settings
    const bot = await prisma.bot.update({
      where: { id },
      data: {
        isAutonomous,
        tweetFrequencyMinutes,
        tweetPrompt: tweetPrompt || null,
      },
    });

    console.log(`Bot ${id} settings updated:`, { isAutonomous: bot.isAutonomous });

    // Notify bot server of settings change
    try {
      const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:3001';
      // For Railway deployment, we need to use https and the domain without port
      const url = BOT_SERVER_URL.includes('railway.app') ? 
        `https://${BOT_SERVER_URL.split(':')[0]}` : 
        BOT_SERVER_URL;
      
      console.log('Attempting to connect to bot server at:', url);
      
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
        const errorText = await response.text();
        console.error('Bot server error:', errorText);
        throw new Error(`Bot server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Bot server response:', result);
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