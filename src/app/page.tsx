'use client'
import { useState } from 'react';
import Snowfall from 'react-snowfall'
import AnimatedTree from "./components/AnimatedTree";
import AIImageAnalyzer from "./components/AIImageAnalyzer";
import Image from 'next/image';
export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Create a custom snowflake using canvas
  const snowflake = document.createElement('canvas')
  snowflake.width = 4
  snowflake.height = 4
  
  const ctx = snowflake.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 4, 4)  // Draw a 4x4 white square
  }

  return (
    <>
    <main className="min-h-screen flex flex-col items-center pt-[20vh]">
      <Snowfall 
        snowflakeCount={200}
        images={[snowflake]}  // Use our custom square snowflake
        radius={[2, 4]}  // Min and max radius
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 0
        }}
      />
      <pre className="text-[0.6em] sm:text-[0.8em] md:text-[1em] whitespace-pre overflow-x-auto text-center leading-none opacity-90">
{`██████╗ ██████╗ ██╗   ██╗██╗██████╗  █████╗ ██╗
██╔══██╗██╔══██╗██║   ██║██║██╔══██╗██╔══██╗██║
██║  ██║██████╔╝██║   ██║██║██║  ██║███████║██║
██║  ██║██╔══██╗██║   ██║██║██║  ██║██╔══██║██║
██████╔╝██║  ██║╚██████╔╝██║██████╔╝██║  ██║██║
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝`}
      </pre>
      <span>[beta]</span>
      <div className="flex flex-row gap-4">
      <Image src="/twitter.png" alt="dex" width={80} height={80} />
      <Image src="/dex.png" alt="dex" width={80} height={80} />
      </div>
      <div className="mt-8">
        <AnimatedTree isAnalyzing={isAnalyzing} />
        <AIImageAnalyzer 
          onAnalysisStart={() => setIsAnalyzing(true)}
          onAnalysisComplete={() => setIsAnalyzing(false)}
        />
      </div>
    </main>
    </>
  );
}
