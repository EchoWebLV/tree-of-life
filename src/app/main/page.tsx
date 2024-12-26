"use client";
import { useState, useEffect } from "react";
import Snowfall from "react-snowfall";
import AnimatedTree from "../components/AnimatedTree";
import AIImageAnalyzer from "../components/AIImageAnalyzer";
import DesktopInterface from "../components/DesktopInterface";
import type { Persona } from "../components/AIImageAnalyzer";
import React from "react";
import { getClientToken } from "../utils/clientToken";
import Logo from "../components/Logo";
import ClientWalletProvider from "../components/WalletProvider";
import WalletButton from "../components/WalletButton";

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        setIsLoading(true);
        const clientToken = getClientToken();
        const response = await fetch(`/api/bots?clientToken=${clientToken}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bots');
        }
        const data = await response.json();
        setBots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching bots:', error);
        setBots([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBots();
  }, []);

  const handleBotDelete = (botId: string) => {
    setBots(bots.filter(bot => bot.id !== botId));
  };

  const handleBotCreated = async (newBot: Bot) => {
    // Fetch all bots again to ensure we have the latest data
    try {
      const clientToken = getClientToken();
      const response = await fetch(`/api/bots?clientToken=${clientToken}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bots');
      }
      const data = await response.json();
      setBots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bots:', error);
      // Fallback to just adding the new bot if fetch fails
      setBots(prevBots => [...prevBots, newBot]);
    }
  };
  
  return (
    <ClientWalletProvider>
      <>
        <Snowfall
          color="white"
          snowflakeCount={35}
          radius={[1, 3]}
          speed={[0.5, 2]}
          wind={[-0.5, 2]}
        />
        <main className="min-h-screen flex flex-col items-center">
          <div className="fixed top-4 right-4 z-50">
            <WalletButton />
          </div>
          <div className="mt-8">
            <AnimatedTree isAnalyzing={isAnalyzing} />
            <AIImageAnalyzer
              isOpen={showAnalyzer}
              onClose={() => setShowAnalyzer(false)}
              onAnalysisStart={() => setIsAnalyzing(true)}
              onAnalysisComplete={() => setIsAnalyzing(false)}
              onBotCreated={(bot: Persona) => {
                handleBotCreated({
                  ...bot,
                  id: crypto.randomUUID(),
                  imageUrl: bot.imageUrl || ''
                });
                setShowAnalyzer(false);
              }}
            />
          </div>
          <DesktopInterface 
            bots={bots} 
            onBotDelete={handleBotDelete}
            isLoading={isLoading}
            onUploadClick={() => setShowAnalyzer(true)}
            setBots={setBots}
            isCreating={isAnalyzing}
          />
        </main>
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white text-[9px] py-1 text-center z-50">
          <span className="opacity-50">MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump</span>
        </div>
      </>
    </ClientWalletProvider>
  );
}
