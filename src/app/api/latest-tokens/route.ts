import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get landing pages that are completed and have a token address
    const tokens = await prisma.landingPage.findMany({
      where: {
        AND: [
          { status: 'completed' },
          { tokenAddress: { not: '' } },
          { error: null } // Ensure there were no deployment errors
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        tokenAddress: true,
        createdAt: true,
        botId: true
      }
    });
    
    // Filter out any landing pages where the bot is just public but not deployed
    const deployedTokens = tokens.filter(token => token.tokenAddress.startsWith('0x') || token.tokenAddress.length === 44);
    
    return NextResponse.json(deployedTokens || []);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
} 