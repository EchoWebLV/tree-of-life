export const maxDuration = 200;
import { NextResponse } from "next/server";
import { PumpFunSDK } from "pumpdotfun-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import bs58 from "bs58";
import { prisma } from "@/lib/prisma";
import { canUserDeploy, recordDeployment } from "@/lib/deploymentLimits";

export async function POST(request: Request) {
  try {
    const { bot, clientToken } = await request.json();

    if (!bot || !bot.name || !bot.imageUrl || !clientToken) {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    // Check deployment limits
    const canDeploy = await canUserDeploy(clientToken);
    if (!canDeploy) {
      return NextResponse.json(
        { error: "Daily deployment limit reached. Try again tomorrow." },
        { status: 429 }
      );
    }

    const connection = new Connection(
      "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
      {
        commitment: "processed",
        wsEndpoint: "wss://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
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

    const mint = Keypair.generate();
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 200;

    const metadata = {
      name: bot.name,
      symbol: bot.name.slice(0, 4).toUpperCase(),
      description: ` `,
      file: imageBlob,
      website: "https://druidai.app/token/" + mint.publicKey.toBase58(),
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

        const tokenAddress = mint.publicKey.toBase58();

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

        if (result.success) {
          await recordDeployment(clientToken);
        }

        return NextResponse.json({
          success: result.success,
          tokenAddress,
          landingPageUrl: `/token/${tokenAddress}`,
          message: "Token deployed successfully",
        });
      } catch (err) {
        console.error(`Attempt ${retryCount + 1} failed:`, err);
        if (retryCount === maxRetries - 1) throw err;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, baseDelay * retryCount));
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
