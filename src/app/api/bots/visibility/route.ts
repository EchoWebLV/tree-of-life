import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { botId, isPublic } = await request.json();

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.update({
      where: { id: botId },
      data: { isPublic },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error updating bot visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update bot visibility' },
      { status: 500 }
    );
  }
} 