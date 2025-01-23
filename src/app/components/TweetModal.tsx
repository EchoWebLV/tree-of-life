import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter, FaEye, FaEyeSlash, FaStop, FaPlay } from "react-icons/fa6";
import { TbSettings } from "react-icons/tb";
import LoadingDots from './LoadingDots';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkTokenBalance } from '../utils/tokenCheck';
import { Bot } from './types';

interface TwitterSettings {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

interface BotStatus {
  isRunning: boolean;
  isAutonomous: boolean;
  lastTweetAt: string | null;
  nextTweetIn: number | null;
}

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTweet: (text: string) => Promise<void>;
  onSaveSettings: (settings: TwitterSettings) => Promise<void>;
  onLoadSettings?: () => Promise<TwitterSettings>;
  persona: Bot;
  onBotUpdate?: (updatedBot: Bot) => void;
}

export default function TweetModal({ 
  isOpen, 
  onClose, 
  onTweet,
  onSaveSettings,
  onLoadSettings,
  persona,
  onBotUpdate
}: TweetModalProps) {
  // Tweet generation state
  const [isTweeting, setIsTweeting] = useState(false);
  const [postedTweet, setPostedTweet] = useState<string | null>(null);
  const [currentBot, setCurrentBot] = useState<Bot>(persona);

  // Twitter settings state
  const [settings, setSettings] = useState<TwitterSettings>({
    appKey: '',
    appSecret: '',
    accessToken: '',
    accessSecret: '',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    appSecret: false,
    accessSecret: false
  });
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  const wallet = useWallet();
  const hasLoadedRef = useRef<boolean>(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMountedRef = useRef<boolean>(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'single' | 'autonomous' | 'settings'>('settings');

  // Helper function to check if settings are configured
  const hasApiSettings = Boolean(
    settings.appKey && 
    settings.appSecret && 
    settings.accessToken && 
    settings.accessSecret
  );

  // Add new state
  const [botStatus, setBotStatus] = useState<BotStatus | null>(() => null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch bot data when modal opens
  useEffect(() => {
    const fetchBotData = async () => {
      if (!isOpen || !persona.id) return;
      
      try {
        const response = await fetch(`/api/bots/${persona.id}`);
        const data = await response.json();
        setCurrentBot(data.bot);
        onBotUpdate?.(data.bot);
      } catch (error) {
        console.error('Error fetching bot data:', error);
      }
    };

    fetchBotData();
  }, [isOpen, persona.id, onBotUpdate]);

  // Token balance check
  useEffect(() => {
    const checkBalance = async () => {
      if (wallet.publicKey) {
        const hasBalance = await checkTokenBalance(wallet.publicKey);
        if (isMountedRef.current) {
          setHasEnoughTokens(hasBalance);
        }
      } else {
        if (isMountedRef.current) {
          setHasEnoughTokens(false);
        }
      }
    };
    
    checkBalance();
  }, [wallet.publicKey]);

  // Load Twitter settings and set initial active tab
  useEffect(() => {
    const loadSettings = async () => {
      if (!isOpen || !onLoadSettings || hasLoadedRef.current || isLoadingSettings) return;
      
      setIsLoadingSettings(true);
      try {
        const loadedSettings = await onLoadSettings();
        if (loadedSettings && isMountedRef.current) {
          setSettings(loadedSettings);
          hasLoadedRef.current = true;
          // If settings exist, set tab to 'single', otherwise keep it on 'settings'
          if (loadedSettings.appKey && 
              loadedSettings.appSecret && 
              loadedSettings.accessToken && 
              loadedSettings.accessSecret) {
            setActiveTab('single');
          }
        }
      } catch (error) {
        console.error('Error loading Twitter settings:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingSettings(false);
        }
      }
    };

    loadSettings();
  }, [isOpen, onLoadSettings]);

  // Add status checking effect
  useEffect(() => {
    const checkStatus = async () => {
      if (!isOpen || !persona.id) return;
      
      try {
        setIsLoadingStatus(true);
        const BOT_SERVER_URL = process.env.NEXT_PUBLIC_BOT_SERVER_URL || 'http://localhost:3001';
        const url = BOT_SERVER_URL.includes('railway.app') ? 
          `https://${BOT_SERVER_URL.split(':')[0]}` : 
          BOT_SERVER_URL;

        const response = await fetch(`${url}/bot-status/${persona.id}`);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const status = await response.json();
        setBotStatus(status);
      } catch (error) {
        console.error('Error fetching bot status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    // Check immediately when opened
    if (isOpen && persona.id) {
      checkStatus();
      // Set up interval for regular checks
      statusIntervalRef.current = setInterval(checkStatus, 5000);
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [isOpen, persona.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPostedTweet(null);
      setActiveTab('settings');
      setSettings({
        appKey: '',
        appSecret: '',
        accessToken: '',
        accessSecret: '',
      });
      setShowSecrets({
        appSecret: false,
        accessSecret: false
      });
      hasLoadedRef.current = false;
    }
  }, [isOpen]);

  const handleGenerateAndTweet = async () => {
    setIsTweeting(true);
    try {
      const response = await fetch('/api/generate-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: persona.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tweet');
      }

      const data = await response.json();
      await onTweet(data.tweet);
      setPostedTweet(data.tweet);
    } catch (error) {
      console.error('Error generating tweet:', error);
    } finally {
      setIsTweeting(false);
    }
  };

  const handleClose = () => {
    setPostedTweet(null);
    setActiveTab('settings');
    onClose();
  };

  const handleAutonomousUpdate = async () => {
    try {
      const response = await fetch(`/api/bots/${persona.id}/autonomous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAutonomous: currentBot.isAutonomous,
          tweetFrequencyMinutes: currentBot.tweetFrequencyMinutes,
          tweetPrompt: currentBot.tweetPrompt || defaultTweetPrompt(currentBot),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update autonomous settings');
      }

      const data = await response.json();
      setCurrentBot(data.bot);
      onBotUpdate?.(data.bot);
      handleClose();
    } catch (error) {
      console.error('Error updating autonomous settings:', error);
    }
  };

  const defaultTweetPrompt = (bot: Bot) => {
    return `You are ${bot.name}, ${bot.personality}

Background: ${bot.background}

Generate a single tweet that aligns with your personality and background. The tweet should be engaging, authentic, and maintain your unique voice.

Keep the tweet under 280 characters and make it feel natural and spontaneous.

Do not use hashtags unless they are genuinely relevant to the content.`;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughTokens) return;
    await onSaveSettings(settings);
    setActiveTab('single');
  };

  const toggleSecretVisibility = (field: 'appSecret' | 'accessSecret') => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoadingSettings) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
            <div className="flex items-center justify-center h-32">
              <LoadingDots />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4 flex items-center gap-2">
            <FaXTwitter /> {activeTab === 'settings' ? 'Settings' : 'Post Tweet'}
          </Dialog.Title>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col w-full">
              <div className="flex gap-4 mb-4">
                <button 
                  className={`pb-1 ${
                    activeTab === 'single' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : hasApiSettings 
                        ? 'text-gray-500 hover:text-gray-300' 
                        : 'text-gray-700 cursor-not-allowed'
                  }`}
                  onClick={() => hasApiSettings && setActiveTab('single')}
                  disabled={!hasApiSettings}
                >
                  Single Tweet
                </button>
                <button 
                  className={`pb-1 ${
                    activeTab === 'autonomous' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : hasApiSettings 
                        ? 'text-gray-500 hover:text-gray-300' 
                        : 'text-gray-700 cursor-not-allowed'
                  }`}
                  onClick={() => hasApiSettings && setActiveTab('autonomous')}
                  disabled={!hasApiSettings}
                >
                  Autonomous Life
                </button>
                <button 
                  className={`pb-1 ${
                    activeTab === 'settings' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
          
          {activeTab === 'single' && (
            postedTweet ? (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded p-4 text-white">
                  <p className="text-sm text-gray-400 mb-2">Posted Tweet:</p>
                  <p>{postedTweet}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateAndTweet}
                  disabled={isTweeting}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTweeting ? 'Generating...' : 'Generate & Tweet'}
                </button>
              </div>
            )
          )}

          {activeTab === 'autonomous' && (
            <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Autonomous Life Settings</h3>
                {botStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    {botStatus.isRunning ? (
                      <>
                        <span className="text-green-400">● Running</span>
                        {botStatus.nextTweetIn && (
                          <span className="text-gray-400">
                            Next tweet in {Math.floor(botStatus.nextTweetIn / 60)}m {botStatus.nextTweetIn % 60}s
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">● Stopped</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentBot.isAutonomous}
                    onChange={(e) => setCurrentBot(prev => ({ ...prev, isAutonomous: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    id="autonomous-toggle"
                  />
                  <label htmlFor="autonomous-toggle" className="text-sm">
                    Enable Autonomous Mode
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm">
                  Tweet Frequency (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.1"
                  value={currentBot.tweetFrequencyMinutes / 60}
                  onChange={(e) => {
                    const hours = parseFloat(e.target.value);
                    if (hours < 1) return; // Prevent values less than 1 hour
                    setCurrentBot(prev => ({
                      ...prev,
                      tweetFrequencyMinutes: hours * 60
                    }));
                  }}
                  className="w-full px-3 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400">
                  Minimum 1 hour between tweets to avoid rate limits
                </p>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Tweet Generation Prompt
                  </label>
                  <button
                    type="button"
                    onClick={() => setCurrentBot(prev => ({ 
                      ...prev, 
                      tweetPrompt: prev.tweetPrompt === undefined ? defaultTweetPrompt(prev) : undefined 
                    }))}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {currentBot.tweetPrompt === undefined ? 'Customize' : 'Reset to Default'}
                  </button>
                </div>
                {currentBot.tweetPrompt === undefined ? (
                  <div className="bg-gray-700 rounded-md p-3 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {defaultTweetPrompt(currentBot)}
                  </div>
                ) : (
                  <textarea
                    value={currentBot.tweetPrompt}
                    onChange={(e) => setCurrentBot(prev => ({ ...prev, tweetPrompt: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 
                             text-sm font-mono text-gray-300 h-48 resize-none"
                    placeholder="Enter custom tweet generation prompt..."
                  />
                )}
                <p className="text-xs text-gray-400">
                  The prompt will be used to generate tweets. You can use variables like {'{name}'}, {'{personality}'}, and {'{background}'}.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (botStatus?.isRunning) {
                      setCurrentBot(prev => ({ ...prev, isAutonomous: false }));
                      handleAutonomousUpdate();
                    } else {
                      handleClose();
                    }
                  }}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                {botStatus?.isRunning ? (
                  <button
                    onClick={() => {
                      setCurrentBot(prev => ({ ...prev, isAutonomous: false }));
                      handleAutonomousUpdate();
                    }}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                  >
                    <FaStop size={12} /> Stop Now
                  </button>
                ) : (
                  <button
                    onClick={handleAutonomousUpdate}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaPlay size={12} /> Start
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">App Key</label>
                <input
                  type="text"
                  value={settings.appKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, appKey: e.target.value }))}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">App Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets.appSecret ? "text" : "password"}
                    value={settings.appSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, appSecret: e.target.value }))}
                    className="w-full bg-gray-800 rounded p-2 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('appSecret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showSecrets.appSecret ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                <input
                  type="text"
                  value={settings.accessToken}
                  onChange={(e) => setSettings(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Secret</label>
                <div className="relative">
                  <input
                    type={showSecrets.accessSecret ? "text" : "password"}
                    value={settings.accessSecret}
                    onChange={(e) => setSettings(prev => ({ ...prev, accessSecret: e.target.value }))}
                    className="w-full bg-gray-800 rounded p-2 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('accessSecret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showSecrets.accessSecret ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-6">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('single')}
                    className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasEnoughTokens}
                    className={`px-4 py-2 rounded ${
                      hasEnoughTokens 
                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Save Settings
                  </button>
                </div>
                {!hasEnoughTokens && (
                  <div className="text-right text-red-400 text-sm">
                    You need at least 20,000 DRU tokens to save settings
                  </div>
                )}
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 