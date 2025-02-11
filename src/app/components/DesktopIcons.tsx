import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import LoadingDots from './LoadingDots';

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

// Static desktop icon component
const StaticDesktopIcon = ({ 
  src, 
  alt, 
  href 
}: { 
  src: string; 
  alt: string; 
  href: string;
}) => (
  <motion.div 
    className="flex flex-col items-center relative group" 
    whileHover={{ scale: 1.5 }}
    onClick={() => window.open(href, '_blank')}
  >
    <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/10">
      <Image 
        src={src} 
        alt={alt} 
        fill 
        className="object-cover transition-all duration-200"
        onError={(e) => console.error(`Error loading ${alt} image:`, e)}
        onLoad={() => console.log(`Successfully loaded ${alt} image`)}
      />
    </div>
    <span className="mt-2 text-xs text-white text-center max-w-full truncate">
      {alt}
    </span>
  </motion.div>
);

interface DesktopIconsProps {
  bots: Bot[];
  isLoading: boolean;
  isCreating?: boolean;
  onUploadClick: () => void;
  onBotClick: (bot: Bot) => void;
  onBotDelete: (botId: string) => void;
}

export default function DesktopIcons({ 
  bots, 
  isLoading, 
  isCreating, 
  onUploadClick,
  onBotClick,
  onBotDelete 
}: DesktopIconsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);

  const handleDelete = async (botId: string) => {
    setDeletingBotId(botId);
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onBotDelete(botId);
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
    setShowDeleteConfirm(null);
    setDeletingBotId(null);
  };

  return (
    <div className="fixed left-4 top-4 grid auto-cols-[96px] gap-6 pointer-events-auto
                    grid-flow-col grid-rows-[repeat(auto-fill,96px)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]">
      {/* Static icons */}
      <StaticDesktopIcon src="/twitter.png" alt="Twitter" href="https://x.com/DruidAi_APP" />
      <StaticDesktopIcon src="/dex.png" alt="Dex" href="https://dexscreener.com/solana/MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump" />
      <StaticDesktopIcon src="/doc.png" alt="Docs" href="https://druid-ai-docs.gitbook.io/start" />
      <StaticDesktopIcon src="/mechroot.png" alt="Mechroot" href="https://mechroot.xyz" />

      {/* Create icon */}
      <motion.div
        className="flex flex-col items-center relative group"
        whileHover={{ scale: 1.5 }}
        onClick={onUploadClick}
      >
        <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/30">
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-white">
            +
          </div>
        </div>
        <span className="mt-2 text-xs text-white text-center max-w-full truncate">
          Create
        </span>
      </motion.div>

      {/* Bot icons */}
      {isLoading ? (
        <motion.div
          className="flex flex-col items-center relative group"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/50 flex items-center justify-center">
            <Image 
              src="/loading.gif" 
              alt="Loading" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Loading
          </span>
        </motion.div>
      ) : (
        [...bots].reverse().map((bot) => (
          <div key={bot.id} className="relative">
            <motion.div
              className="flex flex-col items-center relative group"
              whileHover={{ scale: 1.5 }}
            >
              <div 
                className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => onBotClick(bot)}
              >
                {bot.imageUrl ? (
                  <Image 
                    src={bot.imageUrl} 
                    alt={bot.name} 
                    fill 
                    className="object-cover transition-all duration-200" 
                  />
                ) : (
                  <div className="w-full h-full bg-white/10">
                    <Image 
                      src="/loading.gif" 
                      alt="Loading" 
                      fill 
                      className="object-contain p-2" 
                    />
                  </div>
                )}
                {deletingBotId === bot.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <LoadingDots size="sm" />
                  </div>
                )}
              </div>
              <span className="mt-2 text-xs text-white text-center max-w-full truncate">
                {bot.name}
              </span>
              
              {/* Delete button */}
              <button
                onClick={() => setShowDeleteConfirm(bot.id)}
                className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 rounded-full text-white 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          flex items-center justify-center text-xs"
              >
                ×
              </button>

              {/* Delete confirmation modal */}
              {showDeleteConfirm === bot.id && (
                <div className="absolute left-full ml-2 top-0 w-48 bg-black/90 p-3 rounded-lg z-50">
                  <p className="text-xs text-white mb-2">Delete {bot.name}?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(bot.id)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ))
      )}

      {isCreating && (
        <motion.div
          key="creating"
          className="flex flex-col items-center relative group"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/10 flex items-center justify-center">
            <Image 
              src="/loading.gif" 
              alt="Creating" 
              fill 
              className="object-cover"
            />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Creating...
          </span>
        </motion.div>
      )}
    </div>
  );
}