import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Reverse to maintain chronological order
    const orderedMessages = messages.reverse();

    return NextResponse.json({ messages: orderedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { botId, role, content } = await request.json();

    if (!botId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        botId,
        role,
        content,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error storing message:', error);
    return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
  }
} 