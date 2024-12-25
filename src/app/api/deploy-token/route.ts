import { NextResponse } from "next/server";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import bs58 from "bs58";
import { prisma } from "@/lib/prisma";

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

export async function POST(request: Request) {
  try {
    const { bot, clientToken } = await request.json();

    if (!bot || !bot.name || !bot.imageUrl || !clientToken) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    const mint = Keypair.generate();
    const tokenAddress = mint.publicKey.toBase58();

    // Create landing page first
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

    // Return the landing page URL immediately
    const response = NextResponse.json({
      success: true,
      tokenAddress,
      landingPageUrl: `/token/${tokenAddress}`,
      message: "Token deployment initiated",
    });

    // Handle token deployment asynchronously
    deployToken(bot, mint, tokenAddress, clientToken).catch(console.error);

    return response;

  } catch (error) {
    console.error("Error creating landing page:", error);
    return NextResponse.json(
      {
        error: "Failed to create landing page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function deployToken(bot: Bot, mint: Keypair, tokenAddress: string, clientToken: string) {
  try {
    const connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      {
        commitment: "processed",
        confirmTransactionInitialTimeout: 90000,
      }
    );
    const wallet = new NodeWallet(new Keypair());
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "processed",
      preflightCommitment: "processed",
      skipPreflight: true,
    });
    const sdk = new PumpFunSDK(provider);

    const payerKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.PAYER_PRIVATE_KEY || "")
    );

    const imageResponse = await fetch(bot.imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 200;

    const metadata = {
      name: bot.name,
      symbol: bot.name.slice(0, 4).toUpperCase(),
      description: ` `,
      file: imageBlob,
      website: "https://druidai.app/token/" + tokenAddress,
    };

    while (retryCount < maxRetries) {
      try {
        const result = await sdk.createAndBuy(
          payerKeypair,
          mint,
          metadata,
          BigInt(0),
          BigInt(10000),
          {
            unitLimit: 1000000,
            unitPrice: 1000000,
          }
        );

        if (result.success) {
          await prisma.landingPage.update({
            where: { tokenAddress },
            data: { status: 'completed' }
          });
        }
        
        return;
      } catch (err) {
        console.error(`Attempt ${retryCount + 1} failed:`, err);
        if (retryCount === maxRetries - 1) throw err;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, baseDelay * retryCount));
      }
    }
  } catch (error) {
    console.error("Error deploying token:", error);
  }
}
