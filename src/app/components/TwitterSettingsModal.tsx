import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import LoadingDots from './LoadingDots';
import { useWallet } from '@solana/wallet-adapter-react';
import { checkTokenBalance } from '../utils/tokenCheck';

interface TwitterSettings {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

interface TwitterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TwitterSettings) => Promise<void>;
  initialSettings?: TwitterSettings;
  onLoad?: () => Promise<TwitterSettings>;
}

export default function TwitterSettingsModal({ 
  isOpen, 
  onClose, 
  onSave,
  onLoad
}: TwitterSettingsModalProps) {
  const [settings, setSettings] = useState<TwitterSettings>({
    appKey: '',
    appSecret: '',
    accessToken: '',
    accessSecret: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    appSecret: false,
    accessSecret: false
  });
  const [hasEnoughTokens, setHasEnoughTokens] = useState(false);
  const wallet = useWallet();
  const hasLoadedRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Add token balance check
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

  // Keep existing useEffect for loading settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!isOpen || !onLoad || hasLoadedRef.current || isLoading) return;
      
      // Clear any existing timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // Add a small delay to prevent rapid requests
      loadTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;
        
        setIsLoading(true);
        try {
          const loadedSettings = await onLoad();
          if (loadedSettings && isMountedRef.current) {
            setSettings(loadedSettings);
            hasLoadedRef.current = true;
          }
        } catch (error) {
          console.error('Error loading Twitter settings:', error);
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      }, 100);
    };

    loadSettings();

    // Cleanup function
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isOpen, onLoad, isLoading]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughTokens) return;
    await onSave(settings);
    onClose();
  };

  // Keep existing toggleSecretVisibility function
  const toggleSecretVisibility = (field: 'appSecret' | 'accessSecret') => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Keep existing loading return statement
  if (isLoading) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
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
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4 flex items-center gap-2">
            <FaXTwitter /> Twitter API Settings
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={onClose}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 