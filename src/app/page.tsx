'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from './components/Logo';

interface Token {
  id: string;
  tokenAddress: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  isDexPaid?: boolean;
}

interface DexOrder {
  type: string;
  status: string;
  paymentTimestamp: string;
}

export default function Home() {
  const [latestTokens, setLatestTokens] = useState<Token[]>([]);

  const checkDexPaid = async (tokenAddress: string) => {
    try {
      const response = await fetch(`https://api.dexscreener.com/orders/v1/solana/${tokenAddress}`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      
      // Check if array has any entries and if the first entry is approved
      return data.some((order: DexOrder) => 
        order.type === 'tokenProfile' && 
        order.status === 'approved' &&
        order.paymentTimestamp
      );
    } catch (error) {
      console.error('Error checking DEX paid status:', error);
      return false;
    }
  };

  const fetchLatestTokens = async () => {
    try {
      const response = await fetch('/api/latest-tokens');
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      const data = await response.json();
      
      // Check DEX paid status for each token
      const tokensWithDexStatus = await Promise.all(
        data.map(async (token: Token) => {
          const isDexPaid = await checkDexPaid(token.tokenAddress);
          return { ...token, isDexPaid };
        })
      );
      
      setLatestTokens(tokensWithDexStatus);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  useEffect(() => {
    fetchLatestTokens();
    
    // Set up polling interval (every 30 seconds to respect rate limit)
    const interval = setInterval(fetchLatestTokens, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-black text-white relative">
      {/* Fire background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{
            backgroundImage: "url('/fire.gif')",
            backgroundAttachment: 'fixed',
            zIndex: -1
          }}
        />
      </div>

      {/* Content with higher z-index */}
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <Logo />
          <h2 className="text-xl">Latest AI Agents Launched On Pump</h2>
          <div className="mt-4 flex justify-center gap-4">
            <Link 
              href="/main" 
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>

        {latestTokens.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No tokens have been deployed yet.</p>
            <p className="mt-2">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTokens.map((token) => (
              <Link
                key={token.id}
                href={`/token/${token.tokenAddress}`}
                className="flex bg-black/50 backdrop-blur-sm rounded-lg p-6 hover:bg-black/60 transition-colors flex-col h-full"
              >
                <div className="relative w-full aspect-square mb-4">
                  <Image
                    src={token.imageUrl}
                    alt={token.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <h2 className="text-lg font-bold mb-2">{token.name}</h2>
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="text-sm text-gray-400">
                    {token.isDexPaid ? (
                      <span className="text-green-400">DEX Paid ✓</span>
                    ) : (
                      <span className="text-gray-400">DEX Not Paid ✗</span>
                    )}
                  </div>
                  <div className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-center">
                    View Agent
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
