import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FaXTwitter } from "react-icons/fa6";

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
}

export default function TwitterSettingsModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialSettings 
}: TwitterSettingsModalProps) {
  const [settings, setSettings] = useState<TwitterSettings>(initialSettings || {
    appKey: '',
    appSecret: '',
    accessToken: '',
    accessSecret: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(settings);
    onClose();
  };

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
              <input
                type="password"
                value={settings.appSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, appSecret: e.target.value }))}
                className="w-full bg-gray-800 rounded p-2 text-white"
              />
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
              <input
                type="password"
                value={settings.accessSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, accessSecret: e.target.value }))}
                className="w-full bg-gray-800 rounded p-2 text-white"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Save Settings
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 