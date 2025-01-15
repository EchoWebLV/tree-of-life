import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export async function POST(request: Request) {
  try {
    const { walletAddress, clientToken, signature, message } = await request.json();
    console.log('Received request:', { walletAddress, clientToken, signature });

    if (!walletAddress || !clientToken || !signature || !message) {
      console.log('Missing required fields:', { walletAddress, clientToken, signature, message });
      return NextResponse.json(
        { error: "Wallet address, client token, signature, and message are required" },
        { status: 400 }
      );
    }

    // Verify the signature
    try {
      console.log('Verifying signature for wallet:', walletAddress);
      const publicKey = new PublicKey(walletAddress);
      console.log('Public key bytes:', publicKey.toBytes());
      
      const signatureUint8 = bs58.decode(signature);
      console.log('Signature bytes:', signatureUint8);
      
      const messageUint8 = new TextEncoder().encode(message);
      console.log('Message bytes:', messageUint8);
      
      const isValid = nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKey.toBytes()
      );

      console.log('Signature verification result:', isValid);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return NextResponse.json(
        { error: "Failed to verify signature", details: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      );
    }

    // Check if wallet is already connected to a different client token
    console.log('Checking existing wallet connection...');
    const existingWalletConnection = await prisma.clientWallet.findUnique({
      where: { walletAddress },
    });

    if (existingWalletConnection && existingWalletConnection.clientToken !== clientToken) {
      console.log('Wallet already connected to different token:', existingWalletConnection);
      return NextResponse.json({
        clientToken: existingWalletConnection.clientToken,
        error: "Wallet is already connected to a different account"
      }, { status: 400 });
    }

    // Check if client token is already connected to a different wallet
    console.log('Checking existing client token connection...');
    const existingClientConnection = await prisma.clientWallet.findUnique({
      where: { clientToken },
    });

    if (existingClientConnection && existingClientConnection.walletAddress !== walletAddress) {
      console.log('Client token already connected to different wallet:', existingClientConnection);
      return NextResponse.json(
        { error: "Client token is already connected to a different wallet" },
        { status: 400 }
      );
    }

    // Create or update the connection
    console.log('Creating/updating wallet connection...');
    const clientWallet = await prisma.clientWallet.upsert({
      where: { clientToken },
      update: { walletAddress },
      create: {
        clientToken,
        walletAddress,
      },
    });

    console.log('Connection successful:', clientWallet);
    return NextResponse.json({ clientWallet });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return NextResponse.json(
      { error: "Failed to connect wallet", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}