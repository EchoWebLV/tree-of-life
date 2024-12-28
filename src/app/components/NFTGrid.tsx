import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import type { NFTResponse } from '../types/nft';
import Link from 'next/link';

interface NFTGridProps {
  onSelect: (nft: NFTResponse) => void;
  collectionId?: string;
}

export default function NFTGrid({ onSelect, collectionId }: NFTGridProps) {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<NFTResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!publicKey) return;
      
      try {
        const walletAddress = encodeURIComponent(publicKey.toString());
        const baseUrl = `https://api.simplehash.com/api/v0/nfts/owners_v2?chains=solana&wallet_addresses=${walletAddress}&filters=spam_score__lte=10&order_by=transfer_time__desc&limit=100`;
        const apiUrl = collectionId 
          ? `${baseUrl}&collection_ids=${collectionId}`
          : baseUrl;
        
        console.log('Fetching from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-API-KEY': "teamgpt_sk_6lpgkucpixnk5pnsay1dv3z2741d5d77",
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data.nfts);

        setNfts(data.nfts);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [publicKey, collectionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No NFTs found in this wallet
      </div>
    );
  }

  console.log(nfts)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
      {nfts.map((nft) => (
        <div
          key={nft.nft_id}
          onClick={() => onSelect(nft)}
          className="flex flex-col gap-4 bg-gray-100 p-3 rounded-lg hover:scale-105 transition-all cursor-pointer"
        >
          <div className="aspect-square relative">
            <img
              src={nft.image_url || nft.previews?.image_medium_url}
              alt={nft.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <p className="text-sm font-semibold truncate">{nft.name}</p>
            {nft.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{nft.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 