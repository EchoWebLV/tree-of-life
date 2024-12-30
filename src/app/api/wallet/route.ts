import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { botId, publicKey, privateKey } = await request.json();

    const wallet = await prisma.botWallet.create({
      data: {
        botId,
        publicKey,
        privateKey,
      },
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 });
  }
} 