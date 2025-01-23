import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";
import { TbSettings } from "react-icons/tb";
import AutonomousSettings from './AutonomousSettings';
import { Bot } from './types';

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTweet: (text: string) => Promise<void>;
  onEditSettings: () => void;
  persona: Bot;
  onBotUpdate?: (updatedBot: Bot) => void;
}

export default function TweetModal({ 
  isOpen, 
  onClose, 
  onTweet,
  onEditSettings,
  persona,
  onBotUpdate
}: TweetModalProps) {
  const [isTweeting, setIsTweeting] = useState(false);
  const [postedTweet, setPostedTweet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'autonomous'>('single');
  const [currentBot, setCurrentBot] = useState<Bot>(persona);

  // Fetch bot data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/bots/${persona.id}`)
        .then(res => res.json())
        .then(data => {
          setCurrentBot(data.bot);
          // Also notify parent of updated bot data
          onBotUpdate?.(data.bot);
        })
        .catch(console.error);
    }
  }, [isOpen, persona.id, onBotUpdate]);

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
    setActiveTab('single');
    onClose();
  };

  const handleAutonomousUpdate = () => {
    // Fetch latest bot data
    fetch(`/api/bots/${persona.id}`)
      .then(res => res.json())
      .then(data => {
        setCurrentBot(data.bot);
        // Notify parent of updated bot data
        onBotUpdate?.(data.bot);
      })
      .catch(console.error);
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4 flex items-center gap-2">
            <FaXTwitter /> Post Tweet
          </Dialog.Title>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col w-full">
              <div className="flex gap-4 mb-4">
                <button 
                  className={`pb-1 ${
                    activeTab === 'single' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('single')}
                >
                  Single Tweet
                </button>
                <button 
                  className={`pb-1 ${
                    activeTab === 'autonomous' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('autonomous')}
                >
                  Autonomous Life
                </button>
              </div>
            </div>
            <button
              onClick={onEditSettings}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="Edit API Settings"
            >
              <TbSettings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {activeTab === 'single' ? (
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
          ) : (
            <AutonomousSettings bot={currentBot} onUpdate={handleAutonomousUpdate} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 