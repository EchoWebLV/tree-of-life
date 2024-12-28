import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { PiPillDuotone } from "react-icons/pi";
import LoadingDots from './LoadingDots';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (params: DeployParams) => Promise<void>;
  botName: string;
  hasEnoughTokens?: boolean;
}

export interface DeployParams {
  description: string;
  ticker: string;
  useCustomAddress: boolean;
  privateKey?: string;
}

export default function DeployModal({ 
  isOpen, 
  onClose, 
  onDeploy,
  botName,
  hasEnoughTokens = false
}: DeployModalProps) {
  const [params, setParams] = useState<DeployParams>({
    description: '',
    ticker: '',
    useCustomAddress: false,
    privateKey: '',
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onDeploy({
        description: params.description,
        ticker: params.ticker,
        useCustomAddress: params.useCustomAddress,
        privateKey: params.privateKey,
      });
      onClose();
    } catch (error) {
      console.error('Deploy error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4 flex items-center gap-2">
            <PiPillDuotone /> Deploy {botName} to Pump.Fun
          </Dialog.Title>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingDots />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={params.description}
                  onChange={(e) => setParams(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 rounded p-2 text-white h-24 resize-none"
                  placeholder="Enter token description..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ticker</label>
                <input
                  type="text"
                  value={params.ticker}
                  onChange={(e) => setParams(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                  placeholder="e.g. PUMP"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomAddress"
                    checked={params.useCustomAddress}
                    onChange={(e) => setParams(prev => ({ 
                      ...prev, 
                      useCustomAddress: e.target.checked,
                      privateKey: e.target.checked ? prev.privateKey : ''
                    }))}
                    className="bg-gray-800 rounded"
                  />
                  <label htmlFor="useCustomAddress" className="text-sm text-gray-400">
                    Use custom address
                  </label>
                </div>
              </div>
              {params.useCustomAddress && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Private Key</label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? "text" : "password"}
                      value={params.privateKey}
                      onChange={(e) => setParams(prev => ({ ...prev, privateKey: e.target.value }))}
                      className="w-full bg-gray-800 rounded p-2 text-white pr-10"
                      placeholder="Enter private key..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPrivateKey ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  <a 
                  href="https://vanity.druidai.app/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-blue-400 mt-2 hover:text-blue-300 transition-colors block"
                >
                  Generate your own vanity address →
                </a>
                </div>
              )}
              <div className="space-y-2">
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
                    Deploy (0.03 SOL)
                  </button>
                </div>
                {!hasEnoughTokens && (
                  <div className="text-center text-red-400 text-sm">
                    You need at least 20,000 DRUID tokens to deploy
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