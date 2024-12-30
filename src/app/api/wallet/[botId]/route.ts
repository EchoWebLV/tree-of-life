import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const botId = pathname.split('/').pop();

  try {
    const wallet = await prisma.botWallet.findUnique({
      where: {
        botId: botId,
      },
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
} 