import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const { 
      appKey, 
      appSecret, 
      accessToken, 
      accessSecret,
      tweetingEnabled,
      tweetInterval 
    } = await request.json();

    const existingBot = await prisma.bot.findUnique({
      where: { id: params.id }
    });

    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Update bot settings
    const bot = await prisma.bot.update({
      where: { id: params.id },
      data: {
        tweetingEnabled,
        tweetInterval,
        twitterSettings: {
          upsert: {
            create: {
              clientToken: existingBot.clientToken,
              appKey,
              appSecret,
              accessToken,
              accessSecret,
            },
            update: {
              appKey,
              appSecret,
              accessToken,
              accessSecret,
            }
          }
        }
      },
      include: {
        twitterSettings: true
      }
    });

    return NextResponse.json({
      success: true,
      tweetingEnabled: bot.tweetingEnabled,
      tweetInterval: bot.tweetInterval,
      hasTwitterCredentials: !!bot.twitterSettings
    });
  } catch (error) {
    console.error('Error updating Twitter settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Twitter settings' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const bot = await prisma.bot.findUnique({
      where: { id: params.id },
      select: {
        tweetingEnabled: true,
        tweetInterval: true,
        lastTweetAt: true,
        twitterSettings: {
          select: {
            id: true
          }
        }
      }
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tweetingEnabled: bot.tweetingEnabled,
      tweetInterval: bot.tweetInterval,
      lastTweetAt: bot.lastTweetAt,
      hasTwitterCredentials: !!bot.twitterSettings
    });
  } catch (error) {
    console.error('Error fetching Twitter settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter settings' },
      { status: 500 }
    );
  }
} 