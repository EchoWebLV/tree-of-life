import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Chat from './Chat';

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

interface DesktopInterfaceProps {
  bots: Bot[];
  onBotClick: (bot: Bot) => void;
  onBotDelete: (botId: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
}

export default function DesktopInterface({ bots, onBotClick, onBotDelete, isLoading, onUploadClick }: DesktopInterfaceProps) {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [windows, setWindows] = useState<Bot[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const openWindow = (bot: Bot) => {
    if (!windows.find(w => w.id === bot.id)) {
      setWindows([...windows, bot]);
    }
    setSelectedBot(bot);
  };

  const closeWindow = (botId: string) => {
    setWindows(windows.filter(w => w.id !== botId));
    if (selectedBot?.id === botId) {
      setSelectedBot(null);
    }
  };

  const handleDelete = async (botId: string) => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        closeWindow(botId);
        onBotDelete(botId);
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
    setShowDeleteConfirm(null);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none flex items-center justify-center">
      {/* Desktop Icons */}
      <div className="fixed left-4 top-4 grid grid-flow-col auto-cols-[96px] gap-x-6 pointer-events-auto" 
           style={{ 
             gridTemplateRows: 'repeat(5, minmax(min-content, 1fr))',
             gridAutoFlow: 'column',
             maxHeight: 'calc(100vh - 2rem)',
             gap: '1.5rem'
           }}>
        {/* Static Images */}
        <motion.div className="flex flex-col items-center relative group" whileHover={{ scale: 1.05 }}>
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
            <Image src="/twitter.png" alt="Twitter" fill className="object-cover" />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Twitter
          </span>
        </motion.div>
        
        <motion.div className="flex flex-col items-center relative group" whileHover={{ scale: 1.05 }}>
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
            <Image src="/dex.png" alt="Dex" fill className="object-cover" />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Dex
          </span>
        </motion.div>

        <motion.div 
          className="flex flex-col items-center relative group" 
          whileHover={{ scale: 1.05 }}
          onClick={onUploadClick}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Upload
          </span>
        </motion.div>

        {/* Existing bot icons */}
        {isLoading ? (
          <div className="text-white text-xs animate-pulse">
            Loading...
          </div>
        ) : (
          bots.map((bot) => (
            <motion.div
              key={bot.id}
              className="flex flex-col items-center relative group"
              whileHover={{ scale: 1.05 }}
            >
              <div 
                className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer z-2"
                onClick={() => openWindow(bot)}
              >
                <Image
                  src={bot.imageUrl}
                  alt={bot.name}
                  fill
                  className="object-cover"
                />
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
                <div className="absolute top-0 left-0 w-48 bg-black/90 p-3 rounded-lg -translate-y-full z-20">
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
          ))
        )}
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((bot) => (
          <motion.div
            key={bot.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="pointer-events-auto bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden
                     w-[400px] h-[500px]"
          >
            <div className="flex items-center justify-between p-2 bg-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <Image
                    src={bot.imageUrl}
                    alt={bot.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <span className="text-sm">{bot.name}</span>
              </div>
              <button
                onClick={() => closeWindow(bot.id)}
                className="text-white hover:text-red-500"
              >
                ✕
              </button>
            </div>
            <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
              <Chat persona={bot} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 