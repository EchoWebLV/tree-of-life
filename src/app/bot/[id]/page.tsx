import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Chat from '@/app/components/Chat';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BotLandingPage({ params }: PageProps) {
  const { id } = await params;
  
  const bot = await prisma.bot.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      personality: true,
      background: true
    }
  });

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bot Not Found</h1>
          <p className="text-gray-400">The requested bot could not be found.</p>
        </div>
      </div>
    );
  }

  const persona = {
    name: bot.name,
    personality: bot.personality,
    background: bot.background
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-black text-white">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center space-x-4 bg-white/5 p-6 rounded-lg">
          <div className="relative w-24 h-24">
            <Image
              src={bot.imageUrl}
              alt={bot.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{bot.name}</h1>
            <p className="text-gray-400 mt-2">Public AI Agent</p>
          </div>
        </div>
        
        <div className="h-[600px] bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden">
          <Chat persona={persona} />
        </div>
      </div>
    </main>
  );
} 