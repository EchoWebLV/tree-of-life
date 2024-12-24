import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Chat from '@/app/components/Chat';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BotLandingPage({ params }: PageProps) {
  const { id } = await params;
  
  const landingPage = await prisma.landingPage.findUnique({
    where: { id }
  });

  if (!landingPage) {
    return <div>Bot not found</div>;
  }

  const persona = {
    name: landingPage.name,
    personality: landingPage.personality,
    background: landingPage.background
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-black text-white">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center space-x-4">
          <div className="relative w-24 h-24">
            <Image
              src={landingPage.imageUrl}
              alt={landingPage.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{landingPage.name}</h1>
            <a 
              href={`https://pump.fun/token/${landingPage.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              View on Pump.Fun
            </a>
          </div>
        </div>
        
        <div className="h-[600px] bg-black/50 rounded-lg p-4">
          <Chat persona={persona} />
        </div>
      </div>
    </main>
  );
} 