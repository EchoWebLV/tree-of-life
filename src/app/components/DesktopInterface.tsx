import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingDots from './LoadingDots';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import WindowManager from './WindowManager';
import { DeployParams } from './DeployModal';
interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}
interface DesktopInterfaceProps {
  bots: Bot[];
  onBotDelete: (botId: string) => void;
  isLoading: boolean;
  onUploadClick: () => void;
  setBots: (bots: Bot[]) => void;
  isCreating?: boolean;
  editModalBot: Bot | null;
  onEditModalClose: () => void;
}
// Comment out or remove this constant
// const REQUIRED_TOKEN_AMOUNT = 50000;
// const DRUID_TOKEN_ADDRESS = new PublicKey('MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump');
// New component for static desktop icons
const StaticDesktopIcon = ({ 
  src, 
  alt, 
  href, 
  onClick 
}: { 
  src: string; 
  alt: string; 
  href: string; 
  onClick?: () => void 
}) => (
  <motion.div 
    className="flex flex-col items-center relative group" 
    whileHover={{ scale: 1.5 }}
    onClick={onClick || (() => window.open(href, '_blank'))}
  >
    <div className="w-16 h-16 relative rounded-lg overflow-hidden cursor-pointer">
      <Image 
        src={src} 
        alt={alt} 
        fill 
        className="object-cover transition-all duration-200" 
      />
    </div>
    <span className="mt-2 text-xs text-white text-center max-w-full truncate">
      {alt}
    </span>
  </motion.div>
);
// New component for the deployment modal
const DeploymentModal = ({ 
  isOpen, 
  tokenAddress, 
  landingPageUrl, 
  onClose 
}: { 
  isOpen: boolean; 
  tokenAddress?: string; 
  landingPageUrl?: string; 
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
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
                {tokenAddress}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-gray-500 text-sm italic">
                Token creation may take up to 2 minutes to appear in pump.fun
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => window.open(`${window.location.origin}${landingPageUrl}`, '_blank')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  View Landing Page
                </button>
                <button
                  onClick={onClose}
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
);
// New component for the edit modal
const EditBotModal = ({ 
  isOpen, 
  bot, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  bot?: Bot; 
  onClose: () => void;
  onSubmit: (bot: Bot) => void;
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const generatePersonality = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-personality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate personality');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (formRef.current) {
        const personalityInput = formRef.current.elements.namedItem('personality') as HTMLTextAreaElement;
        const backgroundInput = formRef.current.elements.namedItem('background') as HTMLTextAreaElement;
        
        if (personalityInput && result.personality) {
          personalityInput.value = result.personality;
        }
        if (backgroundInput && result.background) {
          backgroundInput.value = result.background;
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate personality. Please try again.');
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && bot && (
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
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedBot = {
                  ...bot!,
                  name: formData.get('name') as string,
                  personality: formData.get('personality') as string,
                  background: formData.get('background') as string,
                };
                onSubmit(updatedBot);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={bot.name}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                />
              </div>

              {/* AI Prompt Box */}
              <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                <label className="block text-sm font-medium text-gray-400">AI Assistant</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the character you want to create..."
                    className="flex-1 bg-gray-800 rounded p-2 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={generatePersonality}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Describe your character and the AI will generate a personality and background.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Personality</label>
                <textarea
                  name="personality"
                  defaultValue={bot.personality}
                  className="w-full bg-gray-800 rounded p-2 text-white h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Background</label>
                <textarea
                  name="background"
                  defaultValue={bot.background}
                  className="w-full bg-gray-800 rounded p-2 text-white h-24"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
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
  );
};

export default function DesktopInterface({ 
  bots, 
  onBotDelete, 
  isLoading, 
  onUploadClick,
  setBots,
  isCreating = false,
  editModalBot,
  onEditModalClose
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
  const [twitterSettingsModal, setTwitterSettingsModal] = useState<{
    isOpen: boolean;
    bot?: Bot;
  }>({ isOpen: false });

  useEffect(() => {
    if (editModalBot) {
      setEditModal({
        isOpen: true,
        bot: editModalBot
      });
    }
  }, [editModalBot]);

  const wallet = useWallet();
  const PAYMENT_AMOUNT = 0.03 * LAMPORTS_PER_SOL; // 0.01 SOL in lamports
  const TREASURY_ADDRESS = new PublicKey('DruiDHCxP8pAVkST7pxBZokL9UkXj5393K5as3Kj9hi1'); // Replace with your treasury wallet
  const handleDeploy = async (bot: Bot, deployParams?: DeployParams) => {
    if (!wallet || !wallet.signTransaction) {
      alert('Wallet not properly connected');
      return;
    }
    if (!wallet.publicKey) {
      alert('Wallet not found');
      return;
    }
    let txSignature: string | null = null;
    try {
      setIsDeploying(bot.id);
      
      // Create connection
      const connection = new Connection(
        "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/",
        {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 120000,
          wsEndpoint: "wss://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
        }
      );
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: TREASURY_ADDRESS,
          lamports: PAYMENT_AMOUNT,
        })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      // Request signature from user
      const signed = await wallet.signTransaction(transaction);
      
      // Send transaction and store signature
      txSignature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      });
      // Wait for confirmation with more detailed options
      await connection.confirmTransaction({
        signature: txSignature,
        blockhash: blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');
      // Continue with token deployment
      const clientToken = localStorage.getItem('clientToken') || '';
      const response = await fetch('/api/deploy-portal-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bot, 
          clientToken,
          description: deployParams?.description,
          ticker: deployParams?.ticker,
          useCustomAddress: deployParams?.useCustomAddress,
          privateKey: deployParams?.privateKey,
          website: deployParams?.website,
          twitter: deployParams?.twitter,
          telegram: deployParams?.telegram,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deploy token');
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
      
      // Show a more user-friendly message for timeout errors
      if (error instanceof Error && error.message?.includes('TransactionExpiredTimeoutError')) {
        alert('Transaction is taking longer than expected. Please check your wallet or try again with a better connection.');
      } else {
        // If we have a transaction signature and deployment failed, attempt refund
        if (txSignature) {
          try {
            const connection = new Connection(
              "https://aged-capable-uranium.solana-mainnet.quiknode.pro/27f8770e7a18869a2edf701c418b572d5214da01/"
            );
            
            // Create refund transaction
            const { blockhash } = await connection.getLatestBlockhash();
            const refundTx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: TREASURY_ADDRESS,
                toPubkey: wallet.publicKey,
                lamports: PAYMENT_AMOUNT,
              })
            );
            refundTx.recentBlockhash = blockhash;
            refundTx.feePayer = TREASURY_ADDRESS;
            // Send refund transaction
            const refundSignature = await connection.sendTransaction(refundTx, []);
            await connection.confirmTransaction(refundSignature);
            
            alert('Token deployment failed. Your payment has been refunded.');
          } catch (refundError) {
            console.error('Refund failed:', refundError);
            alert('Token deployment failed. Please contact support for a refund.');
          }
        } else {
          alert('Failed to deploy token. Please try again.');
        }
      }
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
      onEditModalClose();
    } catch (error) {
      console.error('Error updating bot:', error);
      alert('Failed to update bot settings');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none flex items-center justify-center">
      <div className="fixed left-4 top-4 grid auto-cols-[96px] gap-6 pointer-events-auto
                    grid-flow-col grid-rows-[repeat(auto-fill,96px)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]">
        {/* Static icons using new component */}
        <StaticDesktopIcon 
          src="/twitter.png" 
          alt="Twitter" 
          href="https://x.com/DruidAi_APP" 
        />
        <StaticDesktopIcon 
          src="/dex.png" 
          alt="Dex" 
          href="https://dexscreener.com/solana/MLoYxeB1Xm4BZyuWLaM3K69LvMSm4TSPXWedF9Epump" 
        />
        <StaticDesktopIcon 
          src="/doc.png" 
          alt="Docs" 
          href="https://druid-ai-docs.gitbook.io/start" 
        />
        {/* Create icon with original structure */}
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
        {/* Existing bot icons */}
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
                  onClick={() => openWindow(bot)}
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
      {/* Windows Manager Component */}
      <WindowManager
        windows={windows}
        selectedBot={selectedBot}
        setSelectedBot={setSelectedBot}
        closeWindow={closeWindow}
        handleDeploy={handleDeploy}
        isDeploying={isDeploying}
        setIsDeploying={setIsDeploying}
        setEditModal={setEditModal}
        setTwitterSettingsModal={setTwitterSettingsModal}
        twitterSettingsModal={twitterSettingsModal}
      />

      <DeploymentModal 
        isOpen={deploymentModal.isOpen}
        tokenAddress={deploymentModal.tokenAddress}
        landingPageUrl={deploymentModal.landingPageUrl}
        onClose={() => setDeploymentModal({ isOpen: false })}
      />

      <EditBotModal 
        isOpen={editModal.isOpen}
        bot={editModal.bot}
        onClose={() => {
          setEditModal({ isOpen: false });
          onEditModalClose();
        }}
        onSubmit={handleBotUpdate}
      />
    </div>
  );
}
