import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Rnd } from 'react-rnd';
import Chat from './Chat';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PiPillDuotone } from 'react-icons/pi';
import LoadingDots from './LoadingDots';

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

interface WindowState {
  id: string;
  isFullscreen: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
}

interface WindowManagerProps {
  windows: Bot[];
  selectedBot: Bot | null;
  setSelectedBot: (bot: Bot | null) => void;
  onClose: (botId: string) => void;
  onDeploy: (bot: Bot) => Promise<void>;
  onEdit: (bot: Bot) => void;
  isDeploying: string | null;
  wallet: { publicKey: null | { toString: () => string } };
}

export default function WindowManager({
  windows,
  selectedBot,
  setSelectedBot,
  onClose,
  onDeploy,
  onEdit,
  isDeploying,
  wallet
}: WindowManagerProps) {
  const [windowStates, setWindowStates] = useState<Record<string, WindowState>>({});

  const getDeployTooltipContent = () => {
    if (isDeploying) return 'Deploying...';
    if (!wallet.publicKey) return 'Connect wallet first';
    return 'Deploy On Pump.Fun (0.01 SOL)';
  };

  return (
    <AnimatePresence>
      {windows.map((bot) => {
        const windowState = windowStates[bot.id] || {
          id: bot.id,
          isFullscreen: false,
          width: 400,
          height: 600,
          x: Math.random() * (window.innerWidth - 400),
          y: Math.random() * (window.innerHeight - 600),
        };

        return (
          <Rnd
            key={bot.id}
            default={{
              x: windowState.x,
              y: windowState.y,
              width: windowState.width,
              height: windowState.height,
            }}
            minWidth={300}
            minHeight={400}
            bounds="window"
            dragHandleClassName="window-handle"
            onDragStop={(e, d) => {
              setWindowStates(prev => ({
                ...prev,
                [bot.id]: { ...windowState, x: d.x, y: d.y }
              }));
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setWindowStates(prev => ({
                ...prev,
                [bot.id]: {
                  ...windowState,
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                  x: position.x,
                  y: position.y,
                }
              }));
            }}
            style={{
              zIndex: selectedBot?.id === bot.id ? 10 : 1,
              ...(windowState.isFullscreen ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
              } : {})
            }}
            className={`pointer-events-auto ${windowState.isFullscreen ? 'fullscreen-window' : ''}`}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/80 backdrop-blur-sm rounded-lg overflow-hidden w-full h-full"
              onClick={() => setSelectedBot(bot)}
            >
              <div className="flex items-center justify-between p-2 bg-white/10 window-handle cursor-move">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src={bot.imageUrl}
                      alt={bot.name}
                      fill
                      className="object-cover rounded grayscale hover:grayscale-0 transition-all duration-200"
                    />
                  </div>
                  <span className="text-sm text-white">{bot.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => onEdit(bot)}
                          className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                   text-white rounded-full hover:opacity-90 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-black/90 text-white text-xs py-1 px-2 rounded"
                          sideOffset={5}
                        >
                          Edit Bot Settings
                          <Tooltip.Arrow className="fill-black/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => onDeploy(bot)}
                          className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                   text-white rounded-full hover:opacity-90 transition-opacity 
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isDeploying === bot.id || !wallet.publicKey}
                        >
                          {isDeploying === bot.id ? (
                            <div className="w-5 h-5 flex items-center justify-center">
                              <LoadingDots size="sm" />
                            </div>
                          ) : (
                            <PiPillDuotone className="w-5 h-5" />
                          )}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-black/90 text-white text-xs py-1 px-2 rounded"
                          sideOffset={5}
                        >
                          {getDeployTooltipContent()}
                          <Tooltip.Arrow className="fill-black/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  <button
                    onClick={() => onClose(bot.id)}
                    className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                             text-white rounded-full hover:opacity-90 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
                <Chat persona={bot} />
              </div>
            </motion.div>
          </Rnd>
        );
      })}
    </AnimatePresence>
  );
} 