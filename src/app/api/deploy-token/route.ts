import { NextResponse } from "next/server";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import bs58 from "bs58";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { bot } = await request.json();

    if (!bot || !bot.name || !bot.imageUrl) {
      return NextResponse.json(
        { error: "Invalid bot data provided" },
        { status: 400 }
      );
    }

    const connection = new Connection(
      "https://morning-fragrant-sunset.solana-mainnet.quiknode.pro/aa3b44d9e34ec9c32482881ae0b50fd3ffb79229/",
      {
        commitment: "finalized",
        wsEndpoint: "wss://morning-fragrant-sunset.solana-mainnet.quiknode.pro/aa3b44d9e34ec9c32482881ae0b50fd3ffb79229/",
        confirmTransactionInitialTimeout: 30000,
      }
    );
    const wallet = new NodeWallet(new Keypair());
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "finalized",
      preflightCommitment: "finalized",
      skipPreflight: true,
    });
    const sdk = new PumpFunSDK(provider);

    // Create wallet from environment variable
    const payerKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.PAYER_PRIVATE_KEY || "")
    );

    // Download image and convert to Blob
    const imageResponse = await fetch(bot.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    const mint = Keypair.generate();
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 500; // Reduced delay

    // Create token metadata
    const metadata = {
      name: bot.name,
      symbol: bot.name.slice(0, 4).toUpperCase(),
      description: `Launched by DruidAI.app.`,
      file: imageBlob,
      website: "localhost:3000/token/" + mint.publicKey.toBase58(),
    };

    while (retryCount < maxRetries) {
      try {
        const result = await sdk.createAndBuy(
          payerKeypair,
          mint,
          metadata,
          BigInt(0.0001 * 1e9),
          BigInt(10000) // Increased slippage for faster execution
        );

        const tokenAddress = mint.publicKey.toBase58();

        // Create landing page record
        await prisma.landingPage.create({
          data: {
            tokenAddress,
            botId: bot.id,
            name: bot.name,
            imageUrl: bot.imageUrl,
            personality: bot.personality,
            background: bot.background,
          },
        });

        return NextResponse.json({
          success: result.success,
          tokenAddress,
          landingPageUrl: `/token/${tokenAddress}`,
          message: "Token deployed successfully",
        });
      } catch (err) {
        if (retryCount === maxRetries - 1) throw err;
        retryCount++;
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error("Error deploying token:", error);
    return NextResponse.json(
      {
        error: "Failed to deploy token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
