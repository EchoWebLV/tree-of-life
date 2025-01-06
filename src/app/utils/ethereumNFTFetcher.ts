import { NFTResponse } from '../types/nft';

export const fetchEthereumNFT = async (address: string, tokenId: string | null): Promise<NFTResponse> => {
  if (!tokenId) {
    throw new Error('Token ID is required for Ethereum NFTs');
  }

  const apiUrl = `https://api.simplehash.com/api/v0/nfts/ethereum/${address}/${tokenId}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'X-API-KEY': 'teamgpt_sk_6lpgkucpixnk5pnsay1dv3z2741d5d77',
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Ethereum NFT data');
  }

  const data = await response.json();
  return data;
}; 