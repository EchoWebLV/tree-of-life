import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TwitterApi } from 'twitter-api-v2';

// Add this header to ensure only Vercel cron can call this endpoint
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all public bots with Twitter settings and check their intervals
    const bots = await prisma.bot.findMany({
      where: {
        isPublic: true,
        tweetingEnabled: true,
        twitterSettings: {
          isNot: null
        },
        OR: [
          { lastTweetAt: null },
          {
            lastTweetAt: {
              lt: new Date(Date.now() - 1000 * 60) // Base check every minute
            }
          }
        ]
      },
      include: {
        twitterSettings: true
      }
    });

    // Generate and post tweets for each eligible bot
    const results = await Promise.all(
      bots.map(async (bot) => {
        try {
          // Check if enough time has passed based on bot's interval
          const timeSinceLastTweet = bot.lastTweetAt 
            ? Date.now() - bot.lastTweetAt.getTime() 
            : Infinity;
          
          if (timeSinceLastTweet < bot.tweetInterval * 60 * 1000) {
            return {
              botId: bot.id,
              success: false,
              error: 'Not time to tweet yet'
            };
          }

          // Generate tweet using existing endpoint
          const tweetResponse = await fetch(`/api/generate-tweet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ persona: bot })
          });
          
          const { tweet } = await tweetResponse.json();

          if (!tweet) {
            throw new Error('No tweet generated');
          }

          // Post tweet using bot's Twitter credentials
          const botTwitterClient = new TwitterApi({
            appKey: bot.twitterSettings.appKey,
            appSecret: bot.twitterSettings.appSecret,
            accessToken: bot.twitterSettings.accessToken,
            accessSecret: bot.twitterSettings.accessSecret,
          });
          
          const tweetResult = await botTwitterClient.v2.tweet(tweet);

          // Update lastTweetAt
          await prisma.bot.update({
            where: { id: bot.id },
            data: { lastTweetAt: new Date() }
          });

          return {
            botId: bot.id,
            success: true,
            tweet,
            tweetId: tweetResult.data.id
          };
        } catch (error) {
          console.error(`Failed to process bot ${bot.id}:`, error);
          return {
            botId: bot.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute cron job' },
      { status: 500 }
    );
  }
} 