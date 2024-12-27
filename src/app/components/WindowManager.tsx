import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PiPillDuotone } from 'react-icons/pi';
import { TbBrandX } from 'react-icons/tb';
import LoadingDots from './LoadingDots';
import Chat from './Chat';
import { useWallet } from '@solana/wallet-adapter-react';
import type { Bot } from './types';
import type { DeployParams } from './DeployModal';
import TwitterSettingsModal from './TwitterSettingsModal';
import TweetModal from './TweetModal';
import DeployModal from './DeployModal';

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
  closeWindow: (botId: string) => void;
  handleDeploy: (bot: Bot, params: DeployParams) => Promise<void>;
  isDeploying: string | null;
  setEditModal: (state: { isOpen: boolean; bot?: Bot }) => void;
  setTwitterSettingsModal: (state: { isOpen: boolean; bot?: Bot }) => void;
  twitterSettingsModal: { isOpen: boolean; bot?: Bot };
}

export default function WindowManager({
  windows,
  selectedBot,
  setSelectedBot,
  closeWindow,
  handleDeploy,
  isDeploying,
  setEditModal,
  setTwitterSettingsModal,
  twitterSettingsModal,
}: WindowManagerProps) {
  const [windowStates, setWindowStates] = useState<Record<string, WindowState>>({});
  const [hasTwitterSettings, setHasTwitterSettings] = useState<Record<string, boolean>>({});
  const [tweetModalBot, setTweetModalBot] = useState<Bot | null>(null);
  const [deployModalBot, setDeployModalBot] = useState<Bot | null>(null);
  const wallet = useWallet();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // You can adjust this breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if bot has Twitter settings
  useEffect(() => {
    windows.forEach(async (bot) => {
      const response = await fetch(`/api/twitter-settings?botId=${bot.id}`);
      const data = await response.json();
      setHasTwitterSettings(prev => ({
        ...prev,
        [bot.id]: !!data.settings
      }));
    });
  }, [windows]);

  const handleTweet = async (text: string) => {
    if (!tweetModalBot) return;
    
    const response = await fetch('/api/post-tweet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        botId: tweetModalBot.id
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post tweet');
    }
  };

  const getDeployTooltipContent = () => {
    if (isDeploying) return 'Deploying...';
    if (!wallet.publicKey) return 'Connect wallet first';
    return 'Configure Deployment';
  };

  const getXTooltipContent = () => {
    // if (!wallet.publicKey) return 'Connect wallet first';
    return 'Connect to X (Twitter)';
  };

  const handleDeploySubmit = async (params: DeployParams) => {
    if (!deployModalBot) return;
    try {
      await handleDeploy(deployModalBot, params);
      setDeployModalBot(null);
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  return (
    <AnimatePresence mode="popLayout">
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
            key={`window-${bot.id}`}
            default={{
              x: windowState.x,
              y: windowState.y,
              width: windowState.width,
              height: windowState.height,
            }}
            disableDragging={isMobile}
            enableResizing={!isMobile}
            minWidth={300}
            minHeight={400}
            bounds="window"
            dragHandleClassName={isMobile ? undefined : "window-handle"}
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
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedBot(bot);
                }
              }}
            >
              <div className="flex items-center justify-between p-2 bg-white/10 window-handle cursor-move">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image
                      src={bot.imageUrl}
                      alt={bot.name}
                      fill
                      className="object-cover rounded transition-all duration-200"
                    />
                  </div>
                  <span className="text-sm">{bot.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip.Provider delayDuration={0}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ isOpen: true, bot });
                          }}
                          className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                     text-white rounded-full hover:opacity-90 transition-opacity
                                     touch-manipulation"
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
                          onClick={() => setDeployModalBot(bot)}
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
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={() => {
                            if (hasTwitterSettings[bot.id]) {
                              setTweetModalBot(bot);
                            } else {
                              setTwitterSettingsModal({ isOpen: true, bot });
                            }
                          }}
                          className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                   text-white rounded-full hover:opacity-90 transition-opacity"
                        >
                          <TbBrandX className="w-5 h-5" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-black/90 text-white text-xs py-1 px-2 rounded"
                          sideOffset={5}
                        >
                          {getXTooltipContent()}
                          <Tooltip.Arrow className="fill-black/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(bot.id);
                    }}
                    className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                             text-white rounded-full hover:opacity-90 transition-opacity
                             touch-manipulation"
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
      <TwitterSettingsModal 
        key="twitter-settings-modal"
        isOpen={twitterSettingsModal?.isOpen || false}
        onClose={() => setTwitterSettingsModal({ isOpen: false })}
        onSave={async (settings) => {
          const clientToken = localStorage.getItem('clientToken') || '';
          const botId = twitterSettingsModal.bot?.id;
          if (!botId) return;

          await fetch('/api/twitter-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...settings,
              clientToken,
              botId,
            }),
          });
          setHasTwitterSettings(prev => ({
            ...prev,
            [botId]: true
          }));
          setTwitterSettingsModal({ isOpen: false });
        }}
        initialSettings={twitterSettingsModal.bot ? {
          appKey: '',
          appSecret: '',
          accessToken: '',
          accessSecret: ''
        } : undefined}
        onLoad={twitterSettingsModal.bot ? async () => {
          const response = await fetch(`/api/twitter-settings?botId=${twitterSettingsModal.bot?.id}`);
          const data = await response.json();
          return data.settings;
        } : undefined}
      />
      <TweetModal
        key="tweet-modal"
        isOpen={!!tweetModalBot}
        onClose={() => setTweetModalBot(null)}
        onTweet={handleTweet}
        onEditSettings={() => {
          setTweetModalBot(null);
          if (tweetModalBot) {
            setTwitterSettingsModal({ isOpen: true, bot: tweetModalBot });
          }
        }}
        persona={tweetModalBot || { name: '', personality: '', background: '' }}
      />
      <DeployModal
        key="deploy-modal"
        isOpen={!!deployModalBot}
        onClose={() => setDeployModalBot(null)}
        onDeploy={handleDeploySubmit}
        botName={deployModalBot?.name || ''}
      />
    </AnimatePresence>
  );
}