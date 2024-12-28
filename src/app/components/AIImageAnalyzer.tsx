'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from './Button';
import { getClientToken } from '../utils/clientToken';
import { useWallet } from '@solana/wallet-adapter-react';
import NFTGrid from './NFTGrid';

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

export interface NFTResponse {
  name: string;
  description: string;
  image_url: string;
  collection: {
    name: string;
    description: string;
  };
  extra_metadata: {
    attributes: Array<{
      trait_type: string;
      value: string;
      display_type: null | string;
    }>;
  };
  chain: 'ethereum' | 'solana';
}

export default function AIImageAnalyzer({
  isOpen,
  onClose,
  onAnalysisComplete,
  onAnalysisStart,
  onBotCreated,
  modalClassName = '',
}: AIImageAnalyzerProps) {
  const { connected } = useWallet();
  const [uploadType, setUploadType] = useState<UploadType>('IMAGE');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [nftAddress, setNftAddress] = useState('');
  const [addressError, setAddressError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setUploadedFile(null);
      setNftAddress('');
    }
  }, [isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        
        // Resize image
        const resizeResponse = await fetch('/api/resize-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: buffer,
        });

        if (!resizeResponse.ok) {
          throw new Error('Failed to resize image');
        }

        // Create blob from resized image
        const resizedBlob = await resizeResponse.blob();
        
        // Create object URL for preview
        const objectUrl = URL.createObjectURL(resizedBlob);
        setSelectedImage(objectUrl);

        // Save file to state
        setUploadedFile(file);
      } catch (error) {
        console.error('Error resizing image:', error);
      }
    }
  };

  const extractAndValidateAddress = (input: string): { address: string | null; chain: 'ethereum' | 'solana' } => {
    // Ethereum address regex (0x followed by 40 hex characters)
    const ethPattern = /0x[a-fA-F0-9]{40}/;
    // Solana address regex (base58)
    const solanaPattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    
    // Direct address check
    if (ethPattern.test(input)) {
      return { address: input.toLowerCase(), chain: 'ethereum' };
    }
    if (solanaPattern.test(input)) {
      return { address: input, chain: 'solana' };
    }
    
    // URL check for marketplaces
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split('/');
      
      // Check each part of the URL path
      for (const part of pathParts) {
        if (ethPattern.test(part)) {
          return { address: part.toLowerCase(), chain: 'ethereum' };
        }
        if (solanaPattern.test(part)) {
          return { address: part, chain: 'solana' };
        }
      }
    } catch {
      // Invalid URL
    }
    
    return { address: null, chain: 'solana' }; // default to solana for backward compatibility
  };

  const analyzeNFT = async () => {
    const { address: validAddress, chain } = extractAndValidateAddress(nftAddress);
    if (!validAddress) {
      setAddressError('Please enter a valid NFT address or URL');
      return;
    }
    setAddressError('');
    
    setIsAnalyzing(true);
    onClose();
    onAnalysisStart?.();
    
    try {
      // Fetch NFT metadata based on chain
      const apiUrl = chain === 'ethereum' 
        ? `https://api.simplehash.com/api/v0/nfts/ethereum/${validAddress}`
        : `https://api.simplehash.com/api/v0/nfts/solana/${validAddress}`;

      const response = await fetch(apiUrl, {
        headers: {
          'X-API-KEY': "teamgpt_sk_6lpgkucpixnk5pnsay1dv3z2741d5d77",
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFT data');
      }

      const data: NFTResponse = await response.json();

      // Fetch and process the NFT image
      const imageResponse = await fetch(data.image_url);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch NFT image');
      }

      // Convert image to buffer and resize
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Send to resize endpoint
      const resizeResponse = await fetch('/api/resize-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      });

      if (!resizeResponse.ok) {
        throw new Error('Failed to resize image');
      }

      // Prepare for upload
      const resizedBlob = await resizeResponse.blob();
      const formData = new FormData();
      formData.append('file', resizedBlob, 'nft-image.jpg');

      // Upload to our server
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload NFT image');
      }

      const { url: blobUrl } = await uploadResponse.json();
      
      // Create persona with our hosted image URL
      const nftPersona = {
        name: data.name,
        imageUrl: blobUrl,
        personality: `An NFT (say you are NFT only if asked) character with the following traits: ${data.extra_metadata.attributes
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
                    {!connected ? (
                      <div className="text-center text-gray-400 py-8">
                        Please connect your wallet to view your NFTs
                      </div>
                    ) : (
                      <NFTGrid
                        onSelect={async (nft) => {
                          setNftAddress(nft.collection.name);
                          await analyzeNFT();
                        }}
                      />
                    )}
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
