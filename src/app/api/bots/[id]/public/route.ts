import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  try {
    const { isPublic } = await request.json();
    
    // First check if the bot exists
    const bot = await prisma.bot.findUnique({
      where: { id: params.id as string }
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Update the bot's visibility
    const updatedBot = await prisma.bot.update({
      where: { id: params.id },
      data: { isPublic }
    });

    return NextResponse.json({ success: true, isPublic: updatedBot.isPublic });
  } catch (error) {
    console.error('Error updating bot visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update bot visibility' },
      { status: 500 }
    );
  }
} 