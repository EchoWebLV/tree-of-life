'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Chat from './Chat';
import Button from './Button';
import { getClientToken } from '../utils/clientToken';
import type { NFTResponse } from '../types/nft';

type UploadType = 'IMAGE' | 'NFT';

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
  const [uploadType, setUploadType] = useState<UploadType>('IMAGE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [nftAddress, setNftAddress] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setUploadedFile(null);
      setNftAddress('');
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setSelectedImage(objectUrl);
    }
  };

  const analyzeNFT = async () => {
    if (!nftAddress) return;
    
    setIsAnalyzing(true);
    onClose();
    onAnalysisStart?.();
    
    try {
      const response = await fetch(`https://api.simplehash.com/api/v0/nfts/solana/${nftAddress}`, {
        headers: {
          'X-API-KEY': 'teamgpt_sk_6lpgkucpixnk5pnsay1dv3z2741d5d77',
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFT data');
      }

      const data: NFTResponse = await response.json();
      
      // Create a persona from NFT data
      const nftPersona = {
        name: data.name,
        imageUrl: data.image_url,
        personality: `An NFT character with the following traits: ${data.extra_metadata.attributes
          .map(attr => `${attr.trait_type}: ${attr.value}`)
          .join(', ')}`,
        background: `From the collection: ${data.collection.name}. ${data.collection.description}. Character description: ${data.description}`,
      };

      // Save bot to database
      const botResponse = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nftPersona,
          clientToken: getClientToken(),
        }),
      });

      if (!botResponse.ok) {
        throw new Error('Failed to create bot');
      }

      const newBot = await botResponse.json();
      onAnalysisComplete?.(newBot);
      onBotCreated?.(newBot);
    } catch (error) {
      console.error('Error analyzing NFT:', error);
    } finally {
      setIsAnalyzing(false);
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
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 rounded-t-lg ${
                      uploadType === 'IMAGE' ? 'bg-white/10' : 'bg-transparent'
                    }`}
                    onClick={() => setUploadType('IMAGE')}
                  >
                    Image
                  </button>
                  <button
                    className={`px-4 py-2 rounded-t-lg ${
                      uploadType === 'NFT' ? 'bg-white/10' : 'bg-transparent'
                    }`}
                    onClick={() => setUploadType('NFT')}
                  >
                    NFT
                  </button>
                </div>
                <Button variant="secondary" onClick={onClose}>✕</Button>
              </div>

              <div className="space-y-4">
                {uploadType === 'IMAGE' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter NFT address"
                      value={nftAddress}
                      onChange={(e) => setNftAddress(e.target.value)}
                      className="w-full p-2 rounded bg-white/10"
                    />
                    <Button
                      variant="secondary"
                      onClick={analyzeNFT}
                      disabled={!nftAddress || isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? 'Fetching NFT...' : 'Bring To Life'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
