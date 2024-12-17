"use client";
import { useState, useEffect, useRef } from "react";
import Snowfall from "react-snowfall";
import AnimatedTree from "./components/AnimatedTree";
import AIImageAnalyzer from "./components/AIImageAnalyzer";
import Image from "next/image";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      if (!audioRef.current) {
        const audio = new Audio("/track.mp3");
        audio.loop = true;
        audioRef.current = audio;
      }

      const attemptPlay = async () => {
        try {
          await audioRef.current?.play();
        } catch (err) {
          console.log("Play failed:", err);
          setIsPlaying(false);
        }
      };

      attemptPlay();

      const playOnInteraction = () => {
        attemptPlay();
        document.removeEventListener("click", playOnInteraction);
        document.removeEventListener("touchstart", playOnInteraction);
      };

      document.addEventListener("click", playOnInteraction);
      document.addEventListener("touchstart", playOnInteraction);

      setTimeout(attemptPlay, 1000);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Play failed:", error);
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const asciiArt = `
██████╗ ██████╗ ██╗   ██╗██╗██████╗      █████╗ ██╗
██╔══██╗██╔══██╗██║   ██║██║██╔══██╗    ██╔══██╗██║
██║  ██║██████╔╝██║   ██║██║██║  ██║    ███████║██║
██║  ██║██╔══██╗██║   ██║██║██║  ██║    ██╔══██║██║
██████╔╝██║  ██║╚█████╔╝ ██║██████╔╝    ██║  ██║██║
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═════╝     ╚═╝  ╚═╝╚═╝`;

  return (
    <>
      <Snowfall
        color="white"
        snowflakeCount={50}
        radius={[2, 5]}
        speed={[0.5, 2]}
        wind={[-0.5, 2]}
      />
      <main className="min-h-screen flex flex-col items-center pt-[20vh]">
        <pre className="text-[0.6em] sm:text-[0.8em] md:text-[1em] whitespace-pre overflow-x-auto text-center leading-none opacity-90">
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
        <audio ref={audioRef} src="/track.mp3" loop preload="auto" />
        <button
          onClick={toggleAudio}
          className="fixed bottom-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z" />
              <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z" />
              <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z" />
            </svg>
          )}
        </button>
      </main>
    </>
  );
}
