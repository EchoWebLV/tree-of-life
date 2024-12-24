import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Chat from '@/app/components/Chat';
import { PiPillDuotone } from 'react-icons/pi';

export default async function TokenLandingPage({ params }: { params: { tokenAddress: string } }) {
  const landingPage = await prisma.landingPage.findUnique({
    where: { tokenAddress: params.tokenAddress }
  });

  if (!landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <p className="text-gray-400">The requested token could not be found.</p>
        </div>
      </div>
    );
  }

  const persona = {
    name: landingPage.name,
    personality: landingPage.personality,
    background: landingPage.background,
    imageUrl: landingPage.imageUrl
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-black text-white">
      <div className="max-w-4xl w-full space-y-8">
        {/* Token Info Header */}
        <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-lg">
          <div className="relative w-24 h-24">
            <Image
              src={landingPage.imageUrl}
              alt={landingPage.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{landingPage.name}</h1>
            <div className="flex items-center gap-4">
              <a 
                href={`https://pump.fun/${landingPage.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 
                         text-white rounded-full hover:opacity-90 transition-opacity"
              >
                <PiPillDuotone className="w-5 h-5" />
                <span>View on Pump.Fun</span>
              </a>
              <a 
                href={`https://dexscreener.com/solana/${landingPage.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Chart
              </a>
            </div>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="h-[600px] bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden">
          <Chat persona={persona} />
        </div>
      </div>
    </main>
  );
} 