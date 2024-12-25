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

export const maxDuration = 300;

// Helper function: fetch with timeout + retries
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  retries = 2
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.warn(
        `[Attempt ${attempt}/${retries}] Fetch timeout after ${timeoutMs}ms for URL: ${url}`
      );
    }, timeoutMs);

    try {
      console.warn(`[Attempt ${attempt}/${retries}] Starting fetch for URL: ${url}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      console.warn(
        `[Attempt ${attempt}/${retries}] Fetch completed with status: ${response.status}`
      );
      return response;
    } catch (error) {
      clearTimeout(timeout);

      console.error(
        `[Attempt ${attempt}/${retries}] Fetch failed for URL: ${url}`,
        error
      );

      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff before retry
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
      );
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

export async function POST(request: Request) {
  try {
    console.warn('Starting deployment request');
    const { bot, clientToken } = await request.json();

    console.warn('Received payload:', {
      botId: bot.id,
      hasClientToken: !!clientToken,
      timestamp: new Date().toISOString(),
    });

    // Validate environment
    if (!process.env.PAYER_PRIVATE_KEY) {
      console.error('Missing PAYER_PRIVATE_KEY');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Generate a new Mint Keypair
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
        status: "deploying",
      },
    });

    console.warn(`Landing page created, starting deployment for ${tokenAddress}`);

    // Wait for deployment to complete instead of running it in background
    await deployToken(bot, mint, tokenAddress, clientToken);

    // Return the landing page URL after deployment is complete
    return NextResponse.json({
      success: true,
      tokenAddress,
      landingPageUrl: `/token/${tokenAddress}`,
      message: "Token deployment completed",
    });
  } catch (error) {
    console.error("Deployment error:", error);
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
  clientToken: string
) {
  const startTime = Date.now();
  
  try {
    console.warn(`[${tokenAddress}] Starting token deployment process`);
    console.warn(`[${tokenAddress}] Bot data:`, {
      name: bot.name,
      imageUrl: bot.imageUrl,
    });

    if (!process.env.PAYER_PRIVATE_KEY) {
      throw new Error("PAYER_PRIVATE_KEY not found in environment variables");
    }

    // Initialize Solana connection
    console.warn(`[${tokenAddress}] Initializing connection`);
    const rpcEndpoint =
      "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/";
    const wsEndpoint = rpcEndpoint.replace("https://", "wss://");

    const connection = new Connection(rpcEndpoint, {
      wsEndpoint,
      commitment: "confirmed",
    });

    console.warn(`[${tokenAddress}] Creating payer keypair`);
    const payerKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.PAYER_PRIVATE_KEY)
    );

    // Directly GET the image (no HEAD request)
    console.warn(`[${tokenAddress}] Attempting to fetch image from: ${bot.imageUrl}`);
    const imageResponse = await fetchWithTimeout(
      bot.imageUrl,
      {
        headers: {
          "Accept": "image/*",
          "User-Agent": "Vercel/Deployment-Bot",
        },
        method: "GET",
        cache: "no-store",
      },
      10000, // 10-second timeout
      2      // Retry up to 2 times
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => "No error text");
      console.error(
        `[${tokenAddress}] Image fetch failed with status ${imageResponse.status}:`,
        errorText
      );
      throw new Error(
        `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    console.warn(`[${tokenAddress}] Image fetch successful:`, {
      contentType,
      dataSize: imageBuffer.byteLength,
    });

    // Prepare IPFS upload with better error handling
    console.warn(`[${tokenAddress}] Preparing IPFS upload with metadata:`, {
      name: bot.name,
      symbol: bot.name.slice(0, 4).toUpperCase(),
      imageSize: imageBuffer.byteLength,
    });

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: contentType });

    formData.append("file", blob, "image.jpg");
    formData.append("name", bot.name);
    formData.append("symbol", bot.name.slice(0, 4).toUpperCase());
    formData.append(
      "description",
      `${bot.personality}\n\n${bot.background}`
    );
    formData.append("website", `https://druidai.app/token/${tokenAddress}`);
    formData.append("showName", "true");

    // Use fetchWithTimeout for IPFS upload with retries
    console.warn(`[${tokenAddress}] Uploading to IPFS`);
    const metadataResponse = await fetchWithTimeout(
      "https://pump.fun/api/ipfs",
      {
        method: "POST",
        body: formData,
      },
      30000, // 30-second timeout for IPFS
      3      // 3 retries for IPFS upload
    );

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text().catch(() => "No error text");
      console.error(`[${tokenAddress}] IPFS upload failed:`, {
        status: metadataResponse.status,
        statusText: metadataResponse.statusText,
        errorText,
      });
      throw new Error(`IPFS upload failed: ${metadataResponse.status} ${metadataResponse.statusText}`);
    }

    const metadataData = await metadataResponse.json().catch(error => {
      console.error(`[${tokenAddress}] Failed to parse IPFS response:`, error);
      throw new Error('Invalid IPFS response format');
    });

    if (!metadataData.metadataUri) {
      console.error(`[${tokenAddress}] Missing metadataUri in IPFS response:`, metadataData);
      throw new Error('Invalid IPFS response: missing metadataUri');
    }

    console.warn(`[${tokenAddress}] IPFS upload successful:`, {
      metadataUri: metadataData.metadataUri,
      name: metadataData.metadata?.name,
      symbol: metadataData.metadata?.symbol,
    });

    // Create transaction (with retries if needed)
    console.warn(`[${tokenAddress}] Creating transaction`);
    let createResponse: Response | undefined;
    let createRetries = 3;

    while (createRetries > 0) {
      try {
        createResponse = await fetchWithTimeout(
          "https://pumpportal.fun/api/trade-local",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicKey: payerKeypair.publicKey.toBase58(),
              action: "create",
              tokenMetadata: {
                name: metadataData.metadata.name,
                symbol: metadataData.metadata.symbol,
                uri: metadataData.metadataUri,
              },
              mint: mint.publicKey.toBase58(),
              denominatedInSol: "true",
              amount: 0,
              slippage: 50,
              priorityFee: 0.001,
              pool: "pump",
            }),
          },
          10000, // 10-second timeout
          2      // Retry 2 times for create
        );

        console.warn(
          `[${tokenAddress}] Create transaction response: ${createResponse.status}`
        );

        if (createResponse.ok) {
          break;
        }

        createRetries--;
        if (createRetries > 0) {
          console.warn(
            `[${tokenAddress}] Retrying create transaction, ${createRetries} attempts left`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`[${tokenAddress}] Create transaction attempt failed:`, error);
        if (createRetries === 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (!createResponse || createResponse.status !== 200) {
      throw new Error(
        `Failed to create transaction: ${
          createResponse?.statusText ?? "No response after retries"
        }`
      );
    }

    // Deserialize and sign
    const txData = await createResponse.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(txData));
    tx.sign([mint, payerKeypair]);

    // Send transaction
    const signature = await connection.sendTransaction(tx);
    const confirmation = await connection.confirmTransaction(signature, "confirmed");

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.warn("Transaction sent:", signature);

    // Record successful deployment usage
    await recordDeployment(clientToken);

    // After all operations are complete, ensure we've waited at least 40 seconds
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(25000 - elapsedTime, 0);
    
    if (remainingTime > 0) {
      console.warn(`[${tokenAddress}] Waiting additional ${remainingTime}ms to meet minimum duration`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    // Update landing page status
    await prisma.landingPage.update({
      where: { tokenAddress },
      data: { status: "completed" },
    });

    console.warn(`[${tokenAddress}] Token deployed successfully`);
  } catch (error) {
    // Ensure minimum duration even on error
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(40000 - elapsedTime, 0);
    
    if (remainingTime > 0) {
      console.warn(`[${tokenAddress}] Waiting additional ${remainingTime}ms to meet minimum duration`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    console.error(`[${tokenAddress}] Deployment failed:`, error);
    await prisma.landingPage.update({
      where: { tokenAddress },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}