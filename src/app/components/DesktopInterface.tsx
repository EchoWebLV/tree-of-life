import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import DesktopIcons from './DesktopIcons';
import WindowManager from './WindowManager';
import { DeploymentModal, EditBotModal } from './Modals';
import { Bot, DesktopInterfaceProps } from './types';

export default function DesktopInterface({ 
  bots, 
  onBotDelete, 
  isLoading, 
  onUploadClick,
  setBots,
  isCreating = false
}: DesktopInterfaceProps) {
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [windows, setWindows] = useState<Bot[]>([]);
  const [deploymentModal, setDeploymentModal] = useState({ 
    isOpen: false,
    tokenAddress: '',
    landingPageUrl: '' 
  });
  const [editModal, setEditModal] = useState({ 
    isOpen: false,
    bot: null as Bot | null 
  });
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const wallet = useWallet();

  const openWindow = (bot: Bot) => {
    if (!windows.find(w => w.id === bot.id)) {
      setWindows(prev => [...prev, bot]);
    }
    setSelectedBot(bot);
  };

  const closeWindow = (botId: string) => {
    setWindows(prev => prev.filter(w => w.id !== botId));
    if (selectedBot?.id === botId) {
      setSelectedBot(null);
    }
  };

  const handleDeploy = async (bot: Bot) => {
    setIsDeploying(bot.id);
    try {
      // Deployment logic here
      setDeploymentModal({ 
        isOpen: true, 
        tokenAddress: "example_address",
        landingPageUrl: "/landing/example" 
      });
    } catch (error) {
      console.error('Error deploying bot:', error);
    }
    setIsDeploying(null);
  };

  const handleBotUpdate = async (updatedBot: Bot) => {
    try {
      const response = await fetch(`/api/bots/${updatedBot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBot),
      });

      if (response.ok) {
        setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
        setEditModal({ isOpen: false, bot: null });
      }
    } catch (error) {
      console.error('Error updating bot:', error);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none flex items-center justify-center">
      <DesktopIcons 
        bots={bots}
        isLoading={isLoading}
        isCreating={isCreating}
        onUploadClick={onUploadClick}
        onBotClick={openWindow}
        onBotDelete={onBotDelete}
      />

      <WindowManager 
        windows={windows}
        selectedBot={selectedBot}
        setSelectedBot={setSelectedBot}
        onClose={closeWindow}
        onDeploy={handleDeploy}
        onEdit={(bot) => setEditModal({ isOpen: true, bot })}
        isDeploying={isDeploying}
        wallet={wallet}
      />

      <DeploymentModal 
        isOpen={deploymentModal.isOpen}
        tokenAddress={deploymentModal.tokenAddress}
        landingPageUrl={deploymentModal.landingPageUrl}
        onClose={() => setDeploymentModal({ isOpen: false, tokenAddress: '', landingPageUrl: '' })}
      />

      <EditBotModal 
        isOpen={editModal.isOpen}
        bot={editModal.bot}
        onClose={() => setEditModal({ isOpen: false, bot: null })}
        onSubmit={handleBotUpdate}
      />
    </div>
  );
} 