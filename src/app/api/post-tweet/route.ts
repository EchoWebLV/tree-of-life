import { NextResponse } from "next/server";
import { TwitterApi } from 'twitter-api-v2';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { text, botId } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid tweet content' }, { status: 400 });
    }

    // Get Twitter settings for this bot
    const settings = await prisma.twitterSettings.findUnique({
      where: { botId },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Twitter settings not found" },
        { status: 404 }
      );
    }

    // Initialize Twitter client with OAuth 1.0a credentials
    const twitterClient = new TwitterApi({
      appKey: settings.appKey,
      appSecret: settings.appSecret,
      accessToken: settings.accessToken,
      accessSecret: settings.accessSecret,
    });

    try {
      const tweet = await twitterClient.v2.tweet({
        text: text,
      });
      console.log('Tweet posted successfully:', tweet.data);

      return NextResponse.json({
        success: true,
        tweetId: tweet.data.id,
      });
    } catch (twitterError: unknown) {
      const error = twitterError as { code?: number; message?: string; data?: unknown };
      console.error('Twitter API Error:', {
        code: error.code,
        message: error.message,
        data: error.data,
      });
      
      if (error?.code === 403) {
        return NextResponse.json({ 
          error: 'Twitter API permissions error. Please check your API settings.' 
        }, { status: 403 });
      }
      
      throw twitterError;
    }
  } catch (error: unknown) {
    console.error('Error posting tweet:', error);
    
    const err = error as { data?: { detail?: string }; message?: string };
    const errorMessage = err.data?.detail || err.message || 'Failed to post tweet';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 