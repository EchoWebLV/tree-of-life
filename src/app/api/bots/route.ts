import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, imageUrl, personality, background } = await request.json();
    
    const bot = await prisma.bot.create({
      data: {
        name,
        imageUrl,
        personality,
        background,
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bots = await prisma.bot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(bots);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
  }
} 