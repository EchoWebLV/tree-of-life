'use client';

import { useState } from 'react';
import Image from 'next/image';
import Chat from './Chat';
import Button from './Button';

interface Persona {
  name: string;
  personality: string;
  background: string;
  messages?: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIImageAnalyzerProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (persona: any) => void;
  onBotCreated?: (bot: any) => void;
  modalClassName?: string;
  buttonIcon?: string;
  buttonText?: string;
}

export default function AIImageAnalyzer({
  onAnalysisComplete,
  onAnalysisStart,
  onBotCreated,
  modalClassName = '',
  buttonIcon = '🌿',
  buttonText = 'Upload Image'
}: AIImageAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);

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
    
    setIsAnalyzing(true);
    setIsOpen(false);
    onAnalysisStart?.();
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });
      
      const data = await response.json();
      
      // Save bot to database
      const botResponse = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.persona.name,
          imageUrl: selectedImage,
          personality: data.persona.personality,
          background: data.persona.background,
        }),
      });
      
      const newBot = await botResponse.json();
      setPersona(newBot);
      onAnalysisComplete?.(newBot);
      onBotCreated?.(newBot);
      setIsOpen(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          icon={buttonIcon}
          position="static"
          onClick={() => setIsOpen(true)}
        >
          {buttonText}
        </Button>
      </div>

      {isOpen && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${modalClassName}`}>
          <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Image</h2>
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
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
                {isAnalyzing ? 'Brining To Life...' : 'Bring To Life'}
              </Button>

              {persona && (
                <div className="mt-4">
                  <Chat persona={persona} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
