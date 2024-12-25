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

export const maxDuration = 180;

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
    console.warn('Starting deployment request');
    
    const { bot, clientToken } = await request.json();
    console.warn('Received payload:', { 
      botId: bot.id, 
      hasClientToken: !!clientToken,
      timestamp: new Date().toISOString() 
    });

    // Validate environment
    if (!process.env.PAYER_PRIVATE_KEY) {
      console.error('Missing PAYER_PRIVATE_KEY');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const mint = Keypair.generate();
    const tokenAddress = mint.publicKey.toBase58();

    console.warn(`Creating landing page for token ${tokenAddress}`);
    
    // Update initial status
    await prisma.landingPage.create({
      data: {
        tokenAddress,
        botId: bot.id,
        name: bot.name,
        imageUrl: bot.imageUrl,
        personality: bot.personality,
        background: bot.background,
        status: "deploying"
      },
    });

    console.warn(`Landing page created, starting deployment for ${tokenAddress}`);

    // Start deployment immediately
    deployToken(bot, mint, tokenAddress, clientToken)
      .catch(async (error) => {
        console.error('Deployment failed:', error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
          timestamp: new Date().toISOString()
        } : error);

        await prisma.landingPage.update({
          where: { tokenAddress },
          data: { 
            status: "failed",
            error: error instanceof Error ? error.message : String(error)
          },
        });
      });

    // Return the landing page URL
    return NextResponse.json({
      success: true,
      tokenAddress,
      landingPageUrl: `/token/${tokenAddress}`,
      message: "Token deployment initiated",
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: "Failed to create landing page" },
      { status: 500 }
    );
  }
}

async function deployToken(
  bot: Bot,
  mint: Keypair,
  tokenAddress: string,
  clientToken: string,
) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  try {
    console.warn(`[${tokenAddress}] Starting token deployment process`);
    console.warn(`[${tokenAddress}] Bot data:`, {
      name: bot.name,
      imageUrl: bot.imageUrl
    });

    if (!process.env.PAYER_PRIVATE_KEY) {
      throw new Error("PAYER_PRIVATE_KEY not found in environment variables");
    }

    console.warn(`[${tokenAddress}] Initializing connection`);
    const rpcEndpoint = "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/";
    const wsEndpoint = rpcEndpoint.replace('https://', 'wss://');
    
    const connection = new Connection(rpcEndpoint, {
      wsEndpoint,
      commitment: 'confirmed'
    });

    console.warn(`[${tokenAddress}] Creating payer keypair`);
    const payerKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.PAYER_PRIVATE_KEY)
    );

    // Prepare image data with retries
    console.warn(`[${tokenAddress}] Fetching image from ${bot.imageUrl}`);
    let imageResponse;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        imageResponse = await fetch(bot.imageUrl);
        if (imageResponse.ok) break;
        console.warn(`[${tokenAddress}] Image fetch attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        console.warn(`[${tokenAddress}] Image fetch attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!imageResponse?.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse?.statusText}`);
    }

    let imageBlob = await imageResponse.blob();
    console.warn(`[${tokenAddress}] Image blob size: ${imageBlob.size}`);
    if (imageBlob.size === 0) {
      throw new Error('Image blob is empty');
    }

    // Create form data for IPFS upload
    console.warn(`[${tokenAddress}] Preparing IPFS upload`);
    const formData = new FormData();
    formData.append("file", imageBlob);
    formData.append("name", bot.name);
    formData.append("symbol", bot.name.slice(0, 4).toUpperCase());
    formData.append("description", `${bot.personality}\n\n${bot.background}`);
    formData.append("website", `https://druidai.app/token/${tokenAddress}`);
    formData.append("showName", "true");

    // Upload to IPFS with retries
    console.warn(`[${tokenAddress}] Uploading to IPFS`);
    let metadataResponse;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        metadataResponse = await fetch("https://pump.fun/api/ipfs", {
          method: "POST",
          body: formData,
        });
        if (metadataResponse.ok) break;
        console.warn(`[${tokenAddress}] IPFS upload attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } catch (error) {
        if (attempt === MAX_RETRIES) throw error;
        console.warn(`[${tokenAddress}] IPFS upload attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!metadataResponse?.ok) {
      throw new Error(`Failed to upload metadata to IPFS: ${metadataResponse?.statusText}`);
    }

    const metadataResponseJSON = await metadataResponse.json();
    console.warn(`[${tokenAddress}] IPFS metadata:`, metadataResponseJSON);

    // Get the create transaction
    console.warn(`[${tokenAddress}] Creating transaction`);
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
            signal
          },
          30000
        );
        console.warn(`[${tokenAddress}] Create transaction response status: ${createResponse.status}`);
        if (createResponse.ok) break;
        retries--;
        if (retries > 0) {
          console.warn(`[${tokenAddress}] Retrying create transaction, ${retries} attempts left`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`[${tokenAddress}] Create transaction attempt failed:`, error);
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

    console.warn("Transaction sent:", signature);

    // Record successful deployment
    await recordDeployment(clientToken);

    // Update landing page status
    await prisma.landingPage.update({
      where: { tokenAddress },
      data: { status: "completed" },
    });

    console.warn(`[${tokenAddress}] Token deployed successfully`);
  } catch (error) {
    console.error(`[${tokenAddress}] Error deploying token:`, error instanceof Error ? {
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

