import { NextResponse } from "next/server";
import { VersionedTransaction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { prisma } from "@/lib/prisma";
import { recordDeployment } from "@/lib/deploymentLimits";

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

export const maxDuration = 60;

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting deployment request');
    
    // Add request timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 290000); // 290 seconds

    const { bot, clientToken } = await request.json();
    console.log('Received payload:', { botId: bot.id, hasClientToken: !!clientToken });

    // Validate environment
    if (!process.env.PAYER_PRIVATE_KEY) {
      console.error('Missing PAYER_PRIVATE_KEY');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Add request validation
    if (!bot || !bot.name || !bot.imageUrl || !clientToken) {
      console.error('Invalid request data:', { bot, hasClientToken: !!clientToken });
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
    deployToken(bot, mint, tokenAddress, clientToken, controller.signal).catch((error) => {
      console.error('Deployment failed:', error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error);
      clearTimeout(timeout);
    });

    return response;
  } catch (error) {
    console.error('Deployment error:', {
      error,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      {
        error: "Failed to create landing page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function deployToken(
  bot: Bot,
  mint: Keypair,
  tokenAddress: string,
  clientToken: string,
  signal: AbortSignal
) {
  try {
    console.log(`Starting token deployment for ${tokenAddress}`);

    if (!process.env.PAYER_PRIVATE_KEY) {
      throw new Error("PAYER_PRIVATE_KEY not found in environment variables");
    }

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
      {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: process.env.SOLANA_WS_URL
      }
    );

    const payerKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.PAYER_PRIVATE_KEY)
    );

    // Prepare image data
    const imageResponse = await fetchWithTimeout(bot.imageUrl, {}, 30000);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    // Create form data for IPFS upload
    const formData = new FormData();
    formData.append("file", imageBlob);
    formData.append("name", bot.name);
    formData.append("symbol", bot.name.slice(0, 4).toUpperCase());
    formData.append("description", `${bot.personality}\n\n${bot.background}`);
    formData.append("website", `https://druidai.app/token/${tokenAddress}`);
    formData.append("showName", "true");

    // Upload to IPFS
    const metadataResponse = await fetchWithTimeout("https://pump.fun/api/ipfs", {
      method: "POST",
      body: formData,
    }, 30000);

    if (!metadataResponse.ok) {
      throw new Error("Failed to upload metadata to IPFS");
    }

    const metadataResponseJSON = await metadataResponse.json();

    // Get the create transaction
    let createResponse: Response | undefined;
    let retries = 3;
    while (retries > 0) {
      try {
        createResponse = await fetchWithTimeout(
          `https://pumpportal.fun/api/trade-local`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicKey: payerKeypair.publicKey.toBase58(),
              action: "create",
              tokenMetadata: {
                name: metadataResponseJSON.metadata.name,
                symbol: metadataResponseJSON.metadata.symbol,
                uri: metadataResponseJSON.metadataUri,
              },
              mint: mint.publicKey.toBase58(),
              denominatedInSol: "true",
              amount: 0,
              slippage: 50,
              priorityFee: 0.001,
              pool: "pump",
            }),
          },
          30000
        );
        if (createResponse.ok) break;
        retries--;
      } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!createResponse || createResponse.status !== 200) {
      throw new Error(
        `Failed to create transaction: ${createResponse?.statusText ?? 'No response after retries'}`
      );
    }

    const txData = await createResponse.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
    tx.sign([mint, payerKeypair]);

    const signature = await connection.sendTransaction(tx);
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log("Transaction sent:", signature);

    // Record successful deployment
    await recordDeployment(clientToken);

    // Update landing page status
    await prisma.landingPage.update({
      where: { tokenAddress },
      data: { status: "completed" },
    });

    console.log("Token deployed successfully");
  } catch (error) {
    console.error("Error deploying token:", error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    } : error);
    await prisma.landingPage.update({
      where: { tokenAddress },
      data: { status: "failed", error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  }
}
