'use client';

import { useState } from 'react';
import Image from 'next/image';
import Chat from './Chat';
import Button from './Button';
import { getClientToken } from '../utils/clientToken';

export interface Persona {
  name: string;
  personality: string;
  background: string;
  messages?: Message[];
  imageUrl?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIImageAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisStart: () => void;
  onAnalysisComplete: (persona: Persona) => void;
  onBotCreated?: (bot: Persona) => void;
  modalClassName?: string;
}

export default function AIImageAnalyzer({
  isOpen,
  onClose,
  onAnalysisComplete,
  onAnalysisStart,
  onBotCreated,
  modalClassName = '',
}: AIImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Create temporary URL for preview
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedFile || !selectedImage) return;
    
    setIsAnalyzing(true);
    onClose();
    onAnalysisStart?.();
    
    try {
      // First, upload the image to Vercel Blob
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url: blobUrl } = await uploadResponse.json();

      // Now analyze the image using the blob URL
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: blobUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const data = await response.json();
      
      if (!data.persona) {
        throw new Error('No persona data received');
      }
      
      // Save bot to database with blob URL
      const botResponse = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.persona.name,
          imageUrl: blobUrl,
          personality: data.persona.personality,
          background: data.persona.background,
          clientToken: getClientToken(),
        }),
      });
      
      if (!botResponse.ok) {
        throw new Error('Failed to create bot');
      }
      
      const newBot = await botResponse.json();
      setPersona(newBot);
      onAnalysisComplete?.(newBot);
      onBotCreated?.(newBot);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center ${modalClassName}`}>
          <div className="bg-background p-6 rounded-lg max-w-lg w-full m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Image</h2>
              <Button
                variant="secondary"
                onClick={onClose}
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
