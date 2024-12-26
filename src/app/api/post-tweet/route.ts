import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { text, botId } = await request.json();

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

    // Initialize Twitter client
    const twitterClient = new TwitterApi({
      appKey: settings.appKey,
      appSecret: settings.appSecret,
      accessToken: settings.accessToken,
      accessSecret: settings.accessSecret,
    });

    // Create tweet
    const tweet = await twitterClient.v2.tweet(text);

    return NextResponse.json({
      success: true,
      tweetId: tweet.data.id,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
    return NextResponse.json(
      { error: "Failed to post tweet" },
      { status: 500 }
    );
  }
} 