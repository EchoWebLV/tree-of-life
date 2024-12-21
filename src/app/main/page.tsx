"use client";
import { useState, useEffect, useRef } from "react";
import Snowfall from "react-snowfall";
import AnimatedTree from "../components/AnimatedTree";
import AIImageAnalyzer from "../components/AIImageAnalyzer";
import DesktopInterface from "../components/DesktopInterface";
import type { Persona } from "../components/AIImageAnalyzer";
import React from "react";
import { getClientToken } from "../utils/clientToken";

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

  const asciiArt = `
██████╗ ██████╗ ██╗   ██╗██╗██████╗      █████╗ ██╗
██╔══██╗██╔══██╗██║   ██║██║██╔══██╗    ██╔══██╗██║
██║  ██║██████╔╝██║   ██║██║██║  ██║    ███████║██║
██║  ██║██╔══██╗██║   ██║██║██║  ██║    ██╔══██║██║
██████╔╝██║  ██║╚█████╔╝ ██║██████╔╝    ██║  ██║██║
╚═════╝ ╚═╝  ╚═╝ ╚════╝ ╚═╝╚═════╝      ╚═╝  ╚═╚═╝`;

  const handleBotDelete = (botId: string) => {
    setBots(bots.filter(bot => bot.id !== botId));
  };

  const handleBotCreated = (newBot: Bot) => {
    setBots(prevBots => [...prevBots, newBot]);
  };

  return (
    <>
      <Snowfall
        color="white"
        snowflakeCount={35}
        radius={[1, 3]}
        speed={[0.5, 2]}
        wind={[-0.5, 2]}
      />
      <main className="min-h-screen flex flex-col items-center">
        <pre className="hidden sm:block text-[0.6em] sm:text-[0.8em] md:text-[1em] whitespace-pre overflow-x-auto text-center leading-none opacity-90">
          {asciiArt.split('\n').map((line, lineIndex) => (
            <span key={lineIndex}>
              {line.split('').map((char, charIndex) => (
                <span key={`${lineIndex}-${charIndex}`} className="animated-char">
                  {char}
                </span>
              ))}
              {lineIndex < asciiArt.split('\n').length - 1 ? '\n' : ''}
            </span>
          ))}
        </pre>
        <span className="hidden sm:block">[beta]</span>
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
          onBotClick={() => {}} 
          onBotDelete={handleBotDelete}
          isLoading={isLoading}
          onUploadClick={() => setShowAnalyzer(true)}
        />
      </main>
    </>
  );
}
