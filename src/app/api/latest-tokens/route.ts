import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tokens = await prisma.landingPage.findMany({
      take: 12,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        tokenAddress: true,
        name: true,
        imageUrl: true,
        createdAt: true
      }
    });
    
    // Ensure we always return an array, even if empty
    return NextResponse.json(tokens || []);
  } catch (error) {
    console.error('Error fetching latest tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 