import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function POST() {
  try {
    // Get all bots to access their imageUrls
    const bots = await prisma.bot.findMany();
    
    // Delete all images from Vercel Blob storage
    await Promise.all(
      bots.map(async (bot) => {
        try {
          if (bot.imageUrl) {
            await del(bot.imageUrl);
          }
        } catch (error) {
          console.error(`Failed to delete blob for bot ${bot.id}:`, error);
        }
      })
    );

    // Delete all bots from the database
    await prisma.bot.deleteMany();

    return NextResponse.json({ message: 'Database and blob storage reset successful' });
  } catch (error) {
    console.error('Error resetting:', error);
    return NextResponse.json(
      { error: 'Failed to reset' },
      { status: 500 }
    );
  }
} 