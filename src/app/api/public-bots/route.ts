import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const publicBots = await prisma.$queryRaw`
      SELECT id, name, "imageUrl", personality, background, "createdAt"
      FROM "Bot"
      WHERE "isPublic" = true
      ORDER BY "createdAt" DESC
      LIMIT 12
    `;
    
    return NextResponse.json(publicBots || []);
  } catch (error) {
    console.error('Error fetching public bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public bots' },
      { status: 500 }
    );
  }
} 