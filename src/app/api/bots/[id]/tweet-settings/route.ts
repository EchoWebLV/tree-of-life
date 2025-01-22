import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const { tweetingEnabled, tweetInterval } = await request.json();

    if (typeof tweetingEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'tweetingEnabled must be a boolean' },
        { status: 400 }
      );
    }

    if (typeof tweetInterval !== 'number' || tweetInterval < 1) {
      return NextResponse.json(
        { error: 'tweetInterval must be a positive number' },
        { status: 400 }
      );
    }

    // First ensure columns exist
    await prisma.$executeRaw`
      ALTER TABLE "Bot" 
      ADD COLUMN IF NOT EXISTS "tweetingEnabled" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "tweetInterval" INTEGER NOT NULL DEFAULT 180,
      ADD COLUMN IF NOT EXISTS "lastTweetAt" TIMESTAMP(3)
    `;

    // Then update the values
    await prisma.$executeRaw`
      UPDATE "Bot"
      SET 
        "tweetingEnabled" = ${tweetingEnabled},
        "tweetInterval" = ${tweetInterval},
        "lastTweetAt" = ${tweetingEnabled ? new Date() : null}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({
      success: true,
      tweetingEnabled,
      tweetInterval
    });
  } catch (error) {
    console.error('Error updating bot tweet settings:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to update bot tweet settings' },
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
    // First ensure columns exist
    await prisma.$executeRaw`
      ALTER TABLE "Bot" 
      ADD COLUMN IF NOT EXISTS "tweetingEnabled" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "tweetInterval" INTEGER NOT NULL DEFAULT 180,
      ADD COLUMN IF NOT EXISTS "lastTweetAt" TIMESTAMP(3)
    `;

    const results = await prisma.$queryRaw<Array<{
      tweetingEnabled: boolean;
      tweetInterval: number;
      lastTweetAt: Date | null;
    }>>`
      SELECT 
        COALESCE("tweetingEnabled", false) as "tweetingEnabled",
        COALESCE("tweetInterval", 180) as "tweetInterval",
        "lastTweetAt"
      FROM "Bot"
      WHERE id = ${params.id}
    `;

    const bot = results[0];
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error fetching tweet settings:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch tweet settings' },
      { status: 500 }
    );
  }
} 