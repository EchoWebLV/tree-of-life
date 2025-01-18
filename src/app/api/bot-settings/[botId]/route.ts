import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface APISettings {
  crypto: boolean;
  news: boolean;
  weather: boolean;
  exchange: boolean;
}

export async function GET(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const settings = await prisma.$queryRaw`
      SELECT * FROM "BotSettings" WHERE "botId" = ${params.botId}
    `;

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        apiSettings: {
          crypto: true,
          news: true,
          weather: true,
          exchange: true
        }
      });
    }

    return NextResponse.json({
      apiSettings: settings[0].apiSettings
    });
  } catch (error) {
    console.error('Error fetching bot settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot settings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    console.log('Received update request for bot:', params.botId);
    
    // Validate botId
    if (!params.botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body:', body);
    
    if (!body.apiSettings) {
      return NextResponse.json(
        { error: 'API settings are required' },
        { status: 400 }
      );
    }

    // Verify the bot exists
    const bot = await prisma.bot.findUnique({
      where: { id: params.botId }
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    console.log('Found bot:', bot);

    // Update or create settings using raw SQL
    const settings = await prisma.$executeRaw`
      INSERT INTO "BotSettings" ("id", "botId", "apiSettings", "createdAt", "updatedAt")
      VALUES (
        ${Prisma.raw('gen_random_uuid()')},
        ${params.botId},
        ${JSON.stringify(body.apiSettings)}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("botId")
      DO UPDATE SET
        "apiSettings" = ${JSON.stringify(body.apiSettings)}::jsonb,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *
    `;

    console.log('Updated settings:', settings);

    // Fetch the updated settings
    const updatedSettings = await prisma.$queryRaw`
      SELECT * FROM "BotSettings" WHERE "botId" = ${params.botId}
    `;

    return NextResponse.json({
      apiSettings: (Array.isArray(updatedSettings) && updatedSettings[0] ? updatedSettings[0].apiSettings : body.apiSettings) as APISettings
    });
  } catch (error) {
    console.error('Error updating bot settings:', {
      error: error instanceof Error ? error.message : error,
      botId: params.botId,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to update bot settings', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 