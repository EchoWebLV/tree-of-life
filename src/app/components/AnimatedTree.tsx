'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import AIImageAnalyzer from './AIImageAnalyzer';

export default function AnimatedTree() {
  const [isPlaying, setIsPlaying] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  const getImageSrc = () => {
    return isPlaying ? '/ui-bottom.gif' : '/ui-bottom.png';
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-0 flex items-end justify-center">
      <button
        onClick={toggleAnimation}
        className="fixed z-50 bottom-8 right-8 bg-foreground text-background px-6 py-3 rounded-full hover:bg-opacity-90 transition-all"
      >
        {isPlaying ? 'Stop Animation' : 'Start Animation'}
      </button>
      
      <div className="relative w-[100vh] h-[50vh]">
        <Image
          ref={imageRef}
          src={getImageSrc()}
          alt="Tree Animation"
          fill
          className="object-cover object-bottom"
          priority
        />
      </div>

      <AIImageAnalyzer />
    </div>
  );
}
