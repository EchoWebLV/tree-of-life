'use client';

import Image from 'next/image';
import Link from 'next/link';

interface BotCardProps {
  id: string;
  name: string;
  imageUrl: string;
  tokenAddress?: string | null;
}

function PumpFunLink({ tokenAddress }: { tokenAddress?: string | null }) {
  if (!tokenAddress) return null;
  
  return (
    <a 
      href={`https://pump.fun/token/${tokenAddress}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-400 hover:underline block truncate"
    >
      View on Pump.Fun
    </a>
  );
}

export function TokenBotCard({ id, name, imageUrl, tokenAddress }: BotCardProps) {
  return (
    <div className="flex bg-black/50 backdrop-blur-sm rounded-lg p-4 hover:bg-black/60 transition-colors gap-4 items-center relative group">
      <Link
        href={`/bot/${id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${name}`}
      />
      <div className="relative w-16 h-16 flex-shrink-0 z-10">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      <div className="flex-1 min-w-0 z-10">
        <h2 className="font-bold mb-1 truncate">{name}</h2>
        <div className="relative">
          <PumpFunLink tokenAddress={tokenAddress} />
        </div>
      </div>
    </div>
  );
}

export function PublicBotCard({ id, name, imageUrl }: BotCardProps) {
  return (
    <div className="flex bg-black/50 backdrop-blur-sm rounded-lg p-4 hover:bg-black/60 transition-colors gap-4 items-center relative group">
      <Link
        href={`/bot/${id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${name}`}
      />
      <div className="relative w-16 h-16 flex-shrink-0 z-10">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      <div className="flex-1 min-w-0 z-10">
        <h2 className="font-bold mb-1 truncate">{name}</h2>
        <div className="text-[10px] bg-white/10 px-2 py-1 rounded-full text-center w-fit">
          Public Bot
        </div>
      </div>
    </div>
  );
} 