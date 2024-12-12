'use client'
import { useState } from 'react';
import AnimatedTree from "./components/AnimatedTree";
import AIImageAnalyzer from "./components/AIImageAnalyzer";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <>
      <AnimatedTree isAnalyzing={isAnalyzing} />
      <AIImageAnalyzer 
        onAnalysisStart={() => setIsAnalyzing(true)}
        onAnalysisComplete={() => setIsAnalyzing(false)}
      />
    </>
  );
}
