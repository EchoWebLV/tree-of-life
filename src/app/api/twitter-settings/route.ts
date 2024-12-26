import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { appKey, appSecret, accessToken, accessSecret, clientToken, botId } = await request.json();

    if (!clientToken || !botId) {
      return NextResponse.json({ error: "Client token and bot ID are required" }, { status: 400 });
    }

    const settings = await prisma.twitterSettings.upsert({
      where: { botId },
      create: {
        botId,
        clientToken,
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
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        appKey: settings.appKey,
        appSecret: settings.appSecret,
        accessToken: settings.accessToken,
        accessSecret: settings.accessSecret,
      },
    });
  } catch (error) {
    console.error("Error saving Twitter settings:", error);
    return NextResponse.json(
      { error: "Failed to save Twitter settings" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: "Bot ID is required" }, { status: 400 });
    }

    const settings = await prisma.twitterSettings.findUnique({
      where: { botId },
    });

    if (!settings) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({
      settings: {
        appKey: settings.appKey,
        appSecret: settings.appSecret,
        accessToken: settings.accessToken,
        accessSecret: settings.accessSecret,
      },
    });
  } catch (error) {
    console.error("Error fetching Twitter settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Twitter settings" },
      { status: 500 }
    );
  }
} 