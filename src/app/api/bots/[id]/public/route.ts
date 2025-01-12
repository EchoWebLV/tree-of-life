import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isPublic } = await request.json();
    
    // First check if the bot exists
    const bot = await prisma.bot.findUnique({
      where: { id: params.id }
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Update the bot with the new isPublic status
    const updatedBot = await prisma.$executeRaw`
      UPDATE "Bot" 
      SET "isPublic" = ${isPublic}
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ success: true, isPublic });
  } catch (error) {
    console.error('Error updating bot visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update bot visibility' },
      { status: 500 }
    );
  }
} 