'use client';

import { useRef } from 'react';
import Image from 'next/image';
import AIImageAnalyzer from './AIImageAnalyzer';

interface AnimatedTreeProps {
  isAnalyzing?: boolean;
}

export default function AnimatedTree({ isAnalyzing = false }: AnimatedTreeProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const getImageSrc = () => {
    return isAnalyzing ? '/ui-bottom.gif' : '/ui-bottom.png';
  };

  return (
    <div className="fixed inset-x-0 bottom-0 flex items-end justify-center">
      <div className="relative w-full max-w-[120vh] h-[60vh]">
        <Image
          ref={imageRef}
          src={getImageSrc()}
          alt="Tree Animation"
          fill
          className="object-contain object-bottom z-[3]"
          priority
        />
      </div>

      <AIImageAnalyzer onAnalysisStart={() => {}} onAnalysisComplete={() => {}} />
    </div>
  );
}
