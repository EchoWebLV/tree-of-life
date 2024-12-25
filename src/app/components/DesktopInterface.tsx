import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Chat from './Chat';
import * as Tooltip from '@radix-ui/react-tooltip';
import { PiPillDuotone } from 'react-icons/pi';
import LoadingDots from './LoadingDots';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

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
  setBots: (bots: Bot[]) => void;
}

const REQUIRED_TOKEN_AMOUNT = 50000;
const DRUID_TOKEN_ADDRESS = new PublicKey('MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump');

export default function DesktopInterface({ 
  bots, 
  onBotDelete, 
  isLoading, 
  onUploadClick,
  setBots 
}: DesktopInterfaceProps) {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [windows, setWindows] = useState<Bot[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [deploymentModal, setDeploymentModal] = useState<{
    isOpen: boolean;
    tokenAddress?: string;
    landingPageUrl?: string;
  }>({ isOpen: false });
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    bot?: Bot;
  }>({ isOpen: false });
  const [hasEnoughTokens, setHasEnoughTokens] = useState<boolean>(false);

  const wallet = useWallet();
  const PAYMENT_AMOUNT = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL in lamports
  const TREASURY_ADDRESS = new PublicKey('DruiDHCxP8pAVkST7pxBZokL9UkXj5393K5as3Kj9hi1'); // Replace with your treasury wallet

  useEffect(() => {
    const checkTokenBalance = async () => {
      if (!wallet.publicKey) {
        setHasEnoughTokens(false);
        return;
      }

      try {
        const connection = new Connection(
          "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
        );

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet.publicKey,
          { mint: DRUID_TOKEN_ADDRESS }
        );

        let tokenBalance = 0;
        if (tokenAccounts.value.length > 0) {
          tokenBalance = Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
        }

        setHasEnoughTokens(tokenBalance >= REQUIRED_TOKEN_AMOUNT);
      } catch (error) {
        console.error('Error checking token balance:', error);
        setHasEnoughTokens(false);
      }
    };

    checkTokenBalance();
  }, [wallet.publicKey]);

  const handleDeploy = async (bot: Bot) => {
    if (!wallet || !wallet.signTransaction) {
      alert('Wallet not properly connected');
      return;
    }

    if (!wallet.publicKey) {
      alert('Wallet not found');
      return;
    }

    try {
      setIsDeploying(bot.id);
      
      // Create connection
      const connection = new Connection(
        "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
      );

      // Check token balance
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { mint: DRUID_TOKEN_ADDRESS }
      );

      let tokenBalance = 0;
      if (tokenAccounts.value.length > 0) {
        tokenBalance = Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount);
      }

      if (tokenBalance < REQUIRED_TOKEN_AMOUNT) {
        alert(`You need at least ${REQUIRED_TOKEN_AMOUNT} DRUID tokens to deploy. Current balance: ${tokenBalance}`);
        setIsDeploying(null);
        return;
      }

      // Create payment transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: TREASURY_ADDRESS,
          lamports: PAYMENT_AMOUNT,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Request signature from user
      const signed = await wallet.signTransaction(transaction);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature);

      // Continue with token deployment
      const clientToken = localStorage.getItem('clientToken') || '';
      const response = await fetch('/api/deploy-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot, clientToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 429) {
          alert('Daily deployment limit reached. Try again tomorrow.');
        } else {
          throw new Error(data.error || 'Failed to deploy token');
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        setDeploymentModal({
          isOpen: true,
          tokenAddress: data.tokenAddress,
          landingPageUrl: data.landingPageUrl,
        });
      } else {
        throw new Error(data.error || 'Failed to deploy token');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to deploy token. Please try again.');
    } finally {
      setIsDeploying(null);
    }
  };

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
    setDeletingBotId(botId);
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
    setDeletingBotId(null);
  };

  const handleBotUpdate = async (updatedBot: Bot) => {
    try {
      const response = await fetch(`/api/bots/${updatedBot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBot),
      });

      if (!response.ok) {
        throw new Error('Failed to update bot');
      }

      // Update local state
      setBots(bots.map(bot => bot.id === updatedBot.id ? updatedBot : bot));
      
      // Update windows state to reflect changes immediately
      setWindows(windows.map(window => 
        window.id === updatedBot.id ? updatedBot : window
      ));
      
      // Update selected bot if it's the one being edited
      if (selectedBot?.id === updatedBot.id) {
        setSelectedBot(updatedBot);
      }
      
      setEditModal({ isOpen: false });
    } catch (error) {
      console.error('Error updating bot:', error);
      alert('Failed to update bot settings');
    }
  };

  const getDeployTooltipContent = () => {
    if (isDeploying) return 'Deploying...';
    if (!wallet.publicKey) return 'Connect wallet first';
    if (!hasEnoughTokens) return `Need ${REQUIRED_TOKEN_AMOUNT} DRUID tokens`;
    return 'Deploy On Pump.Fun (0.01 SOL)';
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none flex items-center justify-center">
      {/* Desktop Icons */}
      <div className="fixed left-4 top-4 grid grid-flow-col auto-cols-[96px] gap-6 pointer-events-auto
                      grid-rows-4 md:grid-rows-5 max-h-[calc(100vh-2rem)]">
        {/* Static Images */}
        <motion.div 
          className="flex flex-col items-center relative group" 
          whileHover={{ scale: 1.05 }}
          onClick={() => window.open('https://x.com/DruidAi_APP', '_blank')}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
            <Image src="/twitter.png" alt="Twitter" fill className="object-cover" />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Twitter
          </span>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center relative group" 
          whileHover={{ scale: 1.05 }}
          onClick={() => window.open('https://dexscreener.com/solana/MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump', '_blank')}
        >
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
          onClick={() => window.open('https://druid-ai-docs.gitbook.io/start', '_blank')}
        >
          <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
            <Image src="/doc.png" alt="Docs" fill className="object-cover" />
          </div>
          <span className="mt-2 text-xs text-white text-center max-w-full truncate">
            Docs
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center relative group" 
          whileHover={{ scale: 1.05 }}
          onClick={onUploadClick}
        >
          <div 
            className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer 
                       bg-yellow-300/40 hover:bg-yellow-300/20 transition-colors 
                       flex items-center justify-center
                       animate-[subtle-glow_2s_ease-in-out_infinite]"
          >
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
              className="text-yellow-100"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span className="mt-2 text-xs text-yellow-100 text-center max-w-full truncate">
            Create
          </span>
        </motion.div>

        {/* Existing bot icons */}
        {isLoading ? (
          <motion.div
            className="flex flex-col items-center relative group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer bg-white/10 flex items-center justify-center">
              <LoadingDots />
            </div>
            <span className="mt-2 text-xs text-white text-center max-w-full truncate">
              Loading
            </span>
          </motion.div>
        ) : ( 
          bots.map((bot) => (
            <div key={bot.id} className="relative">
              <motion.div
                className="flex flex-col items-center relative group"
                whileHover={{ scale: 1.05 }}
              >
                <div 
                  className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openWindow(bot)}
                >
                  <Image src={bot.imageUrl} alt={bot.name} fill className="object-cover" />
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
              </motion.div>

              {/* Delete confirmation modal - now a sibling */}
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
            </div>
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
              <div className="flex items-center gap-2">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => setEditModal({ isOpen: true, bot })}
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
                        onClick={() => handleDeploy(bot)}
                        className="p-1.5 bg-gradient-to-r from-gray-500 to-gray-600 
                                 text-white rounded-full hover:opacity-90 transition-opacity 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeploying === bot.id || !hasEnoughTokens || !wallet.publicKey}
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
                  onClick={() => closeWindow(bot.id)}
                  className="text-white hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 h-[calc(100%-48px)] overflow-y-auto">
              <Chat persona={bot} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {deploymentModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Token Deployed Successfully! 🎉</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Token Address:</p>
                  <p className="text-white bg-gray-800 p-2 rounded text-sm font-mono break-all">
                    {deploymentModal.tokenAddress}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-gray-500 text-sm italic">
                    Token creation may take up to 2 minutes to appear in pump.fun
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => window.open(`${window.location.origin}${deploymentModal.landingPageUrl}`, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      View Landing Page
                    </button>
                    <button
                      onClick={() => setDeploymentModal({ isOpen: false })}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Bot Modal */}
      <AnimatePresence>
        {editModal.isOpen && editModal.bot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-semibold mb-4 text-white">Edit Bot Settings</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const updatedBot = {
                    ...editModal.bot!,
                    name: formData.get('name') as string,
                    personality: formData.get('personality') as string,
                    background: formData.get('background') as string,
                  };
                  handleBotUpdate(updatedBot);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    name="name"
                    defaultValue={editModal.bot.name}
                    className="w-full bg-gray-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Personality</label>
                  <textarea
                    name="personality"
                    defaultValue={editModal.bot.personality}
                    className="w-full bg-gray-800 rounded p-2 text-white h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Background</label>
                  <textarea
                    name="background"
                    defaultValue={editModal.bot.background}
                    className="w-full bg-gray-800 rounded p-2 text-white h-24"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditModal({ isOpen: false })}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 