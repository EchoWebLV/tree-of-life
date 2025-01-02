/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const data = await request.json();
    const updatedBot = await prisma.bot.update({
      where: { id: context.params.id },
      data: {
        name: data.name,
        personality: data.personality,
        background: data.background,
        isUncensored: data.isUncensored,
      },
    });

    return NextResponse.json(updatedBot);
  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Failed to update bot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    await prisma.bot.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    return NextResponse.json(
      { error: 'Failed to delete bot' },
      { status: 500 }
    );
  }
}
