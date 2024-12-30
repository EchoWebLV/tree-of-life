import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { PiPillDuotone } from "react-icons/pi";
import LoadingDots from './LoadingDots';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (params: DeployParams) => void;
  botName: string;
  hasEnoughTokens: boolean;
  isDeploying: boolean;
}

export interface DeployParams {
  description?: string;
  ticker?: string;
  useCustomAddress?: boolean;
  privateKey?: string;
  solAmount?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export default function DeployModal({ 
  isOpen, 
  onClose, 
  onDeploy,
  botName,
  hasEnoughTokens,
  isDeploying
}: DeployModalProps) {
  const [description, setDescription] = useState('');
  const [ticker, setTicker] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [solAmount, setSolAmount] = useState(0.1);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px] max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl text-white mb-4 flex items-center gap-2">
            <PiPillDuotone /> Deploy {botName} to Pump.Fun
          </Dialog.Title>
          
          <div className="space-y-4">
            {isDeploying ? (
              <div className="text-center">
                <LoadingDots />
                <p className="mt-4 text-gray-400">Deploying your token...</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-800 rounded p-2 text-white h-24 resize-none"
                    placeholder="Enter token description..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ticker</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="w-full bg-gray-800 rounded p-2 text-white"
                    placeholder="e.g. PUMP"
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Initial SOL Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={solAmount}
                      onChange={(e) => setSolAmount(Number(e.target.value))}
                      min={0}
                      step={0.1}
                      className="w-full bg-gray-800 rounded p-2 text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">SOL</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Amount of SOL to add to the initial liquidity pool
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomAddress"
                      checked={useCustomAddress}
                      onChange={(e) => setUseCustomAddress(e.target.checked)}
                      className="bg-gray-800 rounded"
                    />
                    <label htmlFor="useCustomAddress" className="text-sm text-gray-400">
                      Use custom address
                    </label>
                  </div>
                </div>

                {useCustomAddress && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Private Key</label>
                    <div className="relative">
                      <input
                        type={showPrivateKey ? "text" : "password"}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
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

                <div className="space-y-4 mt-4">
                  <h3 className="text-sm text-gray-400 font-medium">Social Links</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Twitter</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
                        className="w-full bg-gray-800 rounded p-2 pl-6 text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telegram</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
                        className="w-full bg-gray-800 rounded p-2 pl-6 text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => onDeploy({ 
                  description, 
                  ticker, 
                  useCustomAddress, 
                  privateKey, 
                  solAmount,
                  twitter,
                  telegram
                })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!hasEnoughTokens}
              >
                Deploy
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 