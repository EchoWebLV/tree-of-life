import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TwitterApi } from 'twitter-api-v2';

// Use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Starting cron job...');
    
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Unauthorized request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
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
      select: {
        id: true,
        name: true,
        personality: true,
        background: true,
        tweetInterval: true,
        lastTweetAt: true,
        twitterSettings: {
          select: {
            appKey: true,
            appSecret: true,
            accessToken: true,
            accessSecret: true
          }
        }
      }
    });

    console.log(`Found ${bots.length} bots to process`);

    // Generate and post tweets for each eligible bot
    const results = await Promise.all(
      bots.map(async (bot) => {
        try {
          // Check if enough time has passed based on bot's interval
          const timeSinceLastTweet = bot.lastTweetAt 
            ? Date.now() - bot.lastTweetAt.getTime() 
            : Infinity;
          
          const minutesSinceLastTweet = Math.floor(timeSinceLastTweet / (60 * 1000));
          console.log(`Bot ${bot.id}: ${minutesSinceLastTweet} minutes since last tweet (interval: ${bot.tweetInterval})`);
          
          if (timeSinceLastTweet < bot.tweetInterval * 60 * 1000) {
            console.log(`Bot ${bot.id}: Not time to tweet yet`);
            return {
              botId: bot.id,
              success: false,
              error: 'Not time to tweet yet',
              nextTweetIn: bot.tweetInterval - minutesSinceLastTweet
            };
          }

          console.log(`Bot ${bot.id}: Generating tweet...`);

          // Generate tweet using existing endpoint
          const tweetResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-tweet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ persona: bot })
          });
          
          if (!tweetResponse.ok) {
            throw new Error(`Failed to generate tweet: ${tweetResponse.statusText}`);
          }

          const data = await tweetResponse.json();
          const tweet = data.tweet;

          if (!tweet) {
            throw new Error('No tweet generated');
          }

          console.log(`Bot ${bot.id}: Generated tweet: ${tweet}`);

          if (!bot.twitterSettings) {
            throw new Error('Twitter settings not found');
          }

          console.log(`Bot ${bot.id}: Posting tweet...`);

          // Post tweet using bot's Twitter credentials
          const botTwitterClient = new TwitterApi({
            appKey: bot.twitterSettings.appKey,
            appSecret: bot.twitterSettings.appSecret,
            accessToken: bot.twitterSettings.accessToken,
            accessSecret: bot.twitterSettings.accessSecret,
          });
          
          const tweetResult = await botTwitterClient.v2.tweet(tweet);
          console.log(`Bot ${bot.id}: Tweet posted successfully`);

          // Update lastTweetAt
          await prisma.bot.update({
            where: { id: bot.id },
            data: { lastTweetAt: new Date() }
          });

          console.log(`Bot ${bot.id}: Updated lastTweetAt`);

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

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      botsProcessed: bots.length,
      results
    };

    console.log('Cron job completed:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    const errorResponse = {
      error: 'Failed to execute cron job',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    console.error('Cron job failed:', JSON.stringify(errorResponse, null, 2));

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 