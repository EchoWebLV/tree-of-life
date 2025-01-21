import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TwitterApi } from 'twitter-api-v2';
import { twitterClient } from '@/lib/twitter';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bot = await prisma.bot.findUnique({
      where: { id: params.id },
      include: {
        twitterSettings: true
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Generate test tweet
    const tweetResponse = await fetch(`/api/generate-tweet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: bot })
    });
    
    const { tweet } = await tweetResponse.json();

    if (!tweet) {
      throw new Error('No tweet generated');
    }

    let tweetResult;
    
    // Use bot-specific Twitter credentials if available
    if (bot.twitterSettings) {
      const botTwitterClient = new TwitterApi({
        appKey: bot.twitterSettings.appKey,
        appSecret: bot.twitterSettings.appSecret,
        accessToken: bot.twitterSettings.accessToken,
        accessSecret: bot.twitterSettings.accessSecret,
      });
      tweetResult = await botTwitterClient.v2.tweet(`[TEST] ${tweet}`);
    } else {
      // Fall back to default Twitter client
      tweetResult = await twitterClient.v2.tweet(`[TEST] ${tweet}`);
    }

    return NextResponse.json({
      success: true,
      tweet,
      tweetId: tweetResult.data.id
    });
  } catch (error) {
    console.error('Error testing tweet:', error);
    return NextResponse.json(
      { error: 'Failed to test tweet' },
      { status: 500 }
    );
  }
} 