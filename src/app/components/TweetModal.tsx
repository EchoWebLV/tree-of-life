import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";
import { TbSettings } from "react-icons/tb";

interface TweetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTweet: (text: string) => Promise<void>;
  onEditSettings: () => void;
  persona: {
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

  const handleGenerateAndTweet = async () => {
    setIsTweeting(true);
    try {
      // Generate tweet using AI
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
      
      // Post the generated tweet
      await onTweet(tweet);
      setPostedTweet(tweet);
    } catch (error) {
      console.error('Error posting tweet:', error);
      alert('Failed to post tweet');
    } finally {
      setIsTweeting(false);
    }
  };

  const handleClose = () => {
    setPostedTweet(null);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
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
          
          {postedTweet ? (
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
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 