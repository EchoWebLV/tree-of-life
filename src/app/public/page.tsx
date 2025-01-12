import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Logo from '@/app/components/Logo';
import { TokenBotCard, PublicBotCard } from '@/app/components/BotCard';

export default async function PublicBotsPage() {
  // Fetch deployed bots (with tokens)
  const deployedBots = await prisma.landingPage.findMany({
    where: {
      AND: [
        {
          tokenAddress: {
            not: 'no-token'
          }
        },
        {
          status: 'completed'
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch public bots (without tokens)
  const publicBots = await prisma.landingPage.findMany({
    where: {
      AND: [
        {
          tokenAddress: 'no-token'
        },
        {
          status: 'completed'
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
  });

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
      <div className="w-full max-w-6xl relative z-10">
        <div className="text-center mb-8">
          <Logo />
          <h2 className="text-xl">AI Agents Directory</h2>
          <div className="mt-4 flex justify-center gap-4">
            <Link 
              href="/main" 
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Deployed Bots Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Pump Token Agents</h3>
            {deployedBots.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>No deployed bots available yet.</p>
                <p className="mt-2">Be the first to deploy your bot!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {deployedBots.map((page) => (
                  <TokenBotCard
                    key={page.id}
                    id={page.id}
                    name={page.name}
                    imageUrl={page.imageUrl}
                    tokenAddress={page.tokenAddress}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Public Bots Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">Public Agents</h3>
            {publicBots.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p>No public bots available yet.</p>
                <p className="mt-2">Be the first to make your bot public!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {publicBots.map((page) => (
                  <PublicBotCard
                    key={page.id}
                    id={page.id}
                    name={page.name}
                    imageUrl={page.imageUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 