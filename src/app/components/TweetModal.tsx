import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";
import { TbSettings } from "react-icons/tb";

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTweet: (text: string) => Promise<void>;
  onEditSettings: () => void;
  persona: {
    id: string;
    name: string;
    personality: string;
    background: string;
  };
}

export default function TweetModal({ 
  isOpen, 
  onClose, 
  onTweet,
  onEditSettings,
  persona
}: TweetModalProps) {
  const [isTweeting, setIsTweeting] = useState(false);
  const [postedTweet, setPostedTweet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'autonomous'>('single');
  const [tweetSettings, setTweetSettings] = useState({
    tweetingEnabled: false,
    tweetInterval: 180
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!persona.id) return;
      
      try {
        const response = await fetch(`/api/bots/${persona.id}/tweet-settings`);
        if (response.ok) {
          const data = await response.json();
          setTweetSettings({
            tweetingEnabled: data.tweetingEnabled,
            tweetInterval: data.tweetInterval
          });
        }
      } catch (error) {
        console.error('Error loading tweet settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, persona.id]);

  const handleGenerateAndTweet = async () => {
    setIsTweeting(true);
    try {
      const response = await fetch('/api/generate-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ persona }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tweet');
      }

      const { tweet } = await response.json();
      
      await onTweet(tweet);
      setPostedTweet(tweet);
    } catch (error) {
      console.error('Error posting tweet:', error);
      alert('Failed to post tweet');
    } finally {
      setIsTweeting(false);
    }
  };

  const handleSaveAutonomousSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/bots/${persona.id}/tweet-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Show success feedback
      alert('Autonomous tweet settings saved successfully!');
    } catch (error) {
      console.error('Error saving tweet settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPostedTweet(null);
    setActiveTab('single');
    onClose();
  };

  if (isLoading) {
    return null;
  }

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
                  onClick={() => setActiveTab('single')}
                  className={`pb-1 ${
                    activeTab === 'single' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Single Tweet
                </button>
                <button 
                  onClick={() => setActiveTab('autonomous')}
                  className={`pb-1 ${
                    activeTab === 'autonomous' 
                      ? 'text-white border-b-2 border-blue-500' 
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-white">Enable Autonomous Tweeting</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tweetSettings.tweetingEnabled}
                    onChange={(e) => setTweetSettings(prev => ({
                      ...prev,
                      tweetingEnabled: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer 
                                peer-checked:after:translate-x-full peer-checked:after:border-white 
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                after:bg-white after:rounded-full after:h-5 after:w-5 
                                after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-white mb-2">Tweet Interval (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={tweetSettings.tweetInterval}
                  onChange={(e) => setTweetSettings(prev => ({
                    ...prev,
                    tweetInterval: Math.max(5, Math.min(1440, parseInt(e.target.value) || 180))
                  }))}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Min: 5 minutes, Max: 1440 minutes (24 hours)
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAutonomousSettings}
                  disabled={isSaving}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 