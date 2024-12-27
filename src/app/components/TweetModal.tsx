import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";
import { TbSettings } from "react-icons/tb";

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTweet: (text: string) => Promise<void>;
  onEditSettings: () => void;
}

export default function TweetModal({ 
  isOpen, 
  onClose, 
  onTweet,
  onEditSettings
}: TweetModalProps) {
  const [tweetText, setTweetText] = useState('');
  const [isTweeting, setIsTweeting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tweetText.trim()) return;
    
    setIsTweeting(true);
    try {
      await onTweet(tweetText);
      setTweetText('');
      onClose();
    } catch (error) {
      console.error('Error posting tweet:', error);
      alert('Failed to post tweet');
    } finally {
      setIsTweeting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl text-white flex items-center gap-2">
              <FaXTwitter /> Post Tweet
            </Dialog.Title>
            <button
              onClick={onEditSettings}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="Edit API Settings"
            >
              <TbSettings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                placeholder="What's happening?"
                className="w-full bg-gray-800 rounded p-3 text-white h-32 resize-none"
                maxLength={280}
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {tweetText.length}/280
              </div>
            </div>
            
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
                disabled={!tweetText.trim() || isTweeting}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTweeting ? 'Posting...' : 'Tweet'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 