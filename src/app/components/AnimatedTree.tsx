'use client';

import { useState } from 'react';
import Image from 'next/image';
import AIImageAnalyzer from './AIImageAnalyzer';
import Button from './Button';

interface AnimatedTreeProps {
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
}

export default function AnimatedTree({ isAnalyzing = false, onAnalyze }: AnimatedTreeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    onAnalyze?.();
    setIsModalOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 flex items-end justify-center">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Image</h2>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />

              {selectedImage && (
                <div className="relative w-full h-48">
                  <Image
                    src={selectedImage}
                    alt="Selected image"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <Button
                variant="secondary"
                onClick={analyzeImage}
                disabled={!selectedImage || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'Bringing To Life...' : 'Bring To Life'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AIImageAnalyzer 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnalysisStart={() => {}} 
        onAnalysisComplete={() => {}} 
      />
    </div>
  );
}
