'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from './Button';
import { getClientToken } from '../utils/clientToken';
import { fetchEthereumNFT } from '../utils/ethereumNFTFetcher';
import { fetchSolanaNFT } from '../utils/solanaNFTFetcher';
import { Bot } from './types';

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
  onAnalysisComplete: (persona: Bot) => void;
  onBotCreated?: (bot: Bot) => void;
  modalClassName?: string;
}

export interface NFTResponse {
  nft_id: string;
  chain: 'ethereum' | 'solana';
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  previews: {
    image_small_url?: string;
    image_medium_url?: string;
    image_large_url?: string;
    image_opengraph_url?: string;
    blurhash?: string;
    predominant_color?: string;
  };
  image_url: string;
  image_properties?: {
    width: number;
    height: number;
    size: number;
    mime_type: string;
    exif_orientation: string | null;
  };
  collection: {
    collection_id: string;
    name: string;
    description: string;
    image_url: string;
    external_url?: string;
    twitter_username?: string;
    discord_url?: string;
    instagram_username?: string;
  };
  extra_metadata: {
    attributes: Array<{
      trait_type: string;
      value: string;
      display_type: null | string;
    }>;
    image_original_url?: string;
    animation_original_url?: string;
    metadata_original_url?: string;
  };
  created_date: string;
  status: string;
  contract?: {
    type: string;
    name: string;
    symbol: string;
  };
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

  const extractAndValidateAddress = (input: string): { address: string | null; tokenId: string | null; chain: 'ethereum' | 'solana' } => {
    // Ethereum address regex (0x followed by 40 hex characters)
    const ethPattern = /0x[a-fA-F0-9]{40}/i;
    // Solana address regex (base58)
    const solanaPattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    
    let address = null;
    let tokenId = null;
    let chain: 'ethereum' | 'solana' = 'solana';

    // Check if it's a URL
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split('/').filter(part => part); // Remove empty strings
      
      // Handle OpenSea URL format: /assets/ethereum/0x.../tokenId
      if (url.hostname === 'opensea.io' && pathParts[0] === 'assets') {
        // Check if it's an Ethereum NFT
        if (pathParts[1] === 'ethereum') {
          const contractAddress = pathParts[2];
          const tokenIdPart = pathParts[3];
          
          if (ethPattern.test(contractAddress) && /^\d+$/.test(tokenIdPart)) {
            address = contractAddress.toLowerCase();
            tokenId = tokenIdPart;
            chain = 'ethereum';
            return { address, tokenId, chain };
          }
        }
      }
      
      // Handle other URL formats
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        
        // Check for Ethereum address
        if (ethPattern.test(part)) {
          address = part.toLowerCase();
          chain = 'ethereum';
          // Look for token ID in the next part
          if (i + 1 < pathParts.length && /^\d+$/.test(pathParts[i + 1])) {
            tokenId = pathParts[i + 1];
          }
          break;
        }
        // Check for Solana address
        if (solanaPattern.test(part)) {
          address = part;
          chain = 'solana';
          break;
        }
      }
    } catch {
      // Not a URL, try direct input formats
      
      // Check for Ethereum address with token ID format: 0x123...abc/123
      const ethWithTokenMatch = input.match(new RegExp(`(${ethPattern.source})/(\\d+)`, 'i'));
      if (ethWithTokenMatch) {
        address = ethWithTokenMatch[1].toLowerCase();
        tokenId = ethWithTokenMatch[2];
        chain = 'ethereum';
      }
      // Check for just Ethereum address
      else if (ethPattern.test(input)) {
        address = input.toLowerCase();
        chain = 'ethereum';
      }
      // Check for Solana address
      else if (solanaPattern.test(input)) {
        address = input;
        chain = 'solana';
      }
    }
    
    return { address, tokenId, chain };
  };

  const analyzeNFT = async () => {
    const { address: validAddress, tokenId, chain } = extractAndValidateAddress(nftAddress);
    
    if (!validAddress) {
      setAddressError('Please enter a valid NFT address or URL');
      return;
    }

    if (chain === 'ethereum' && !tokenId) {
      setAddressError('For Ethereum NFTs, please include the token ID (e.g., 0x...abc/123 or https://opensea.io/.../123)');
      return;
    }
    
    setAddressError('');
    setIsAnalyzing(true);
    onClose();
    onAnalysisStart?.();
    
    try {
      // Use the appropriate fetcher based on the chain
      const data = chain === 'ethereum' 
        ? await fetchEthereumNFT(validAddress, tokenId)
        : await fetchSolanaNFT(validAddress);
      
      // Try all possible image URL sources in order of preference
      const imageUrl = data.previews?.image_large_url || 
                      data.previews?.image_medium_url || 
                      data.previews?.image_small_url || 
                      data.image_url ||
                      data.extra_metadata?.image_original_url;

      console.log('Available image URLs:', {
        large: data.previews?.image_large_url,
        medium: data.previews?.image_medium_url,
        small: data.previews?.image_small_url,
        default: data.image_url,
        original: data.extra_metadata?.image_original_url
      });

      if (!imageUrl) {
        throw new Error('No image URL found in NFT data');
      }

      // Fetch and process the NFT image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch NFT image: ${imageUrl}`);
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
        personality: `An NFT (say you are NFT only if asked) character from the ${data.collection.name} collection. ${
          data.extra_metadata.attributes
            ? `This NFT has the following traits: ${data.extra_metadata.attributes
                .map(attr => `${attr.trait_type}: ${attr.value}`)
                .join(', ')}`
            : ''
        }`,
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
          isAutonomous: false,
          tweetFrequencyMinutes: 60,
          lastTweetAt: null,
          authToken: '',
          isPublic: false
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
      setAddressError(error instanceof Error ? error.message : 'Failed to analyze NFT');
      setIsAnalyzing(false);
      return;
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
          isAutonomous: false,
          tweetFrequencyMinutes: 60,
          lastTweetAt: null,
          authToken: '',
          isPublic: false
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
                      placeholder="Enter NFT address or URL"
                      value={nftAddress || ''}
                      onChange={(e) => {
                        setNftAddress(e.target.value);
                        setAddressError('');
                      }}
                      className="w-full p-2 rounded bg-white/10"
                    />
                    {addressError && (
                      <p className="text-red-500 text-sm mt-1">{addressError}</p>
                    )}
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
