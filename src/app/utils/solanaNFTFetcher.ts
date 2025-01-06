import { NFTResponse } from '../types/nft';

export const fetchSolanaNFT = async (address: string): Promise<NFTResponse> => {
  const apiUrl = `https://api.simplehash.com/api/v0/nfts/solana/${address}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'X-API-KEY': 'teamgpt_sk_6lpgkucpixnk5pnsay1dv3z2741d5d77',
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Solana NFT data');
  }

  const data = await response.json();
  return data;
}; 