import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAuthToken } from '@/app/utils/authToken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
      const body = await request.json();
      
      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
  
      const { name, imageUrl, personality, background } = body;
  
      // Validate required fields
      if (!name || !imageUrl || !personality || !background) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      const bot = await prisma.bot.create({
        data: {
          name,
          imageUrl,
          personality,
          background,
          authToken: generateAuthToken(),
        },
      });
  
      return NextResponse.json(bot);
    } catch (error) {
      console.error('Error creating bot:', error);
      return NextResponse.json(
        { error: 'Failed to create bot', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
}

export async function GET() {
  try {
    const bots = await prisma.bot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    if (!bots) {
      return NextResponse.json({ bots: [] });
    }
    
    return NextResponse.json(bots);
  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 