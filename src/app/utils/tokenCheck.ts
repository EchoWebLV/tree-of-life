import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const REQUIRED_TOKEN_AMOUNT = 20000;
const DRUID_TOKEN_ADDRESS = new PublicKey('MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump');

export async function checkTokenBalance(walletAddress: PublicKey): Promise<boolean> {
  try {
    const connection = new Connection(
      "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
      'confirmed'
    );

    // Get all token accounts for the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletAddress,
      { programId: TOKEN_PROGRAM_ID }
    );

    console.log(tokenAccounts);

    // Find the DRUID token account
    const druidAccount = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === DRUID_TOKEN_ADDRESS.toString()
    );

    if (!druidAccount) {
      return false;
    }

    const balance = Number(druidAccount.account.data.parsed.info.tokenAmount.amount);
    return balance >= REQUIRED_TOKEN_AMOUNT;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
} 