import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const {
      appKey,
      appSecret,
      accessToken,
      accessSecret
    } = await request.json();

    // Validate Twitter credentials
    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      return new Response(
        JSON.stringify({
          error: 'Missing Twitter credentials',
          required: ['appKey', 'appSecret', 'accessToken', 'accessSecret']
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create or update a test bot
    const bot = await prisma.bot.upsert({
      where: {
        id: 'test-bot'
      },
      create: {
        id: 'test-bot',
        name: 'Test Bot',
        imageUrl: 'https://placekitten.com/200/200',
        personality: 'A friendly test bot that tweets every 5 minutes',
        background: 'Created for testing tweet intervals',
        authToken: 'test-token',
        clientToken: 'test-client-token',
        isPublic: true,
        tweetingEnabled: true,
        tweetInterval: 5 // 5 minutes
      },
      update: {
        tweetingEnabled: true,
        tweetInterval: 5,
        lastTweetAt: null // Reset last tweet time
      }
    });

    // Create or update Twitter settings separately
    const twitterSettings = await prisma.twitterSettings.upsert({
      where: {
        botId: bot.id
      },
      create: {
        botId: bot.id,
        clientToken: 'test-client-token',
        appKey,
        appSecret,
        accessToken,
        accessSecret
      },
      update: {
        appKey,
        appSecret,
        accessToken,
        accessSecret
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test bot created/updated',
        bot: {
          id: bot.id,
          name: bot.name,
          tweetInterval: bot.tweetInterval,
          tweetingEnabled: bot.tweetingEnabled,
          hasTwitterSettings: !!twitterSettings
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Failed to create test bot:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({
        error: 'Failed to create test bot',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 