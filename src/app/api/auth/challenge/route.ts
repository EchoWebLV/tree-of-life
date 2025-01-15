import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Generate a random nonce
    const nonce = randomBytes(32).toString('base64');
    
    // Create a challenge message
    const message = `Welcome to Druid AI!

Please sign this message to verify your wallet ownership. This will not trigger a blockchain transaction or cost any gas fees.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${Date.now()}`;

    return NextResponse.json({ message, nonce });
  } catch (error) {
    console.error("Error generating challenge:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
} 