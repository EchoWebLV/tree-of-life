import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tokens = await prisma.landingPage.findMany({
      take: 12,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching latest tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
} 