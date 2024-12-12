'use client'
import AnimatedTree from "./components/AnimatedTree";
import AIImageAnalyzer from "./components/AIImageAnalyzer";
import { useEffect, useRef } from 'react';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.2;
    }
  }, []);

  return (
    <>
      <video 
        ref={videoRef}
        className="video-background" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <AnimatedTree />
      <AIImageAnalyzer />
    </>
  );
}
