'use client'
import { useState, useEffect, useRef } from 'react';
import Snowfall from 'react-snowfall'
import AnimatedTree from "./components/AnimatedTree";
import AIImageAnalyzer from "./components/AIImageAnalyzer";
import Image from 'next/image';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [snowflake, setSnowflake] = useState<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create a custom snowflake using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 4, 4);  // Draw a 4x4 white square
    }
    
    setSnowflake(canvas);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      // Try to play the audio
      const playPromise = audioRef.current.play();
      
      // Handle potential play() promise rejection
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  }, []); // Run once when component mounts

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
    <main className="min-h-screen flex flex-col items-center pt-[20vh]">
      {snowflake && (
        <Snowfall 
          snowflakeCount={200}
          images={[snowflake]}
          radius={[2, 4]}
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 0
          }}
        />
      )}
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
      <audio
        ref={audioRef}
        src="/track.mp3"
        loop
      />
      <button
        onClick={toggleAudio}
        className="fixed bottom-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
            <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
            <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        )}
      </button>
    </main>
    </>
  );
}
