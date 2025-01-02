import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCopy } from "react-icons/fa";

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string;
  privateKey: string;
}

const WalletDetailsModal = ({
  isOpen,
  onClose,
  publicKey,
  privateKey,
}: WalletDetailsModalProps) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState({ public: false, private: false });

  useEffect(() => {
    if (!isOpen) {
      setShowPrivateKey(false);
      setCopied({ public: false, private: false });
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowPrivateKey(false);
    setCopied({ public: false, private: false });
    onClose();
  };

  const trimKey = (key: string) => {
    return key.replace(/[\s\uFEFF\xA0\u200B\u2028\u2029]+/g, '').slice(0, 88);
  };

  const handleCopyClick = async (type: 'public' | 'private') => {
    try {
      await navigator.clipboard.writeText(trimKey(type === 'public' ? publicKey : privateKey));
      setCopied(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4">
            Wallet Details
          </Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Public Key</label>
              <div className="relative">
                <div className="w-full bg-gray-800 rounded p-2 text-white font-mono text-sm break-all pr-10">
                  {trimKey(publicKey)}
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => handleCopyClick('public')}
                    className="text-gray-400 hover:text-gray-300 p-1"
                    title={copied.public ? "Copied!" : "Copy public key"}
                  >
                    <FaCopy size={16} className={copied.public ? "text-green-400" : ""} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Private Key</label>
              <div className="relative">
                <div className="w-full bg-gray-800 rounded p-2 text-white font-mono text-sm break-all pr-20">
                  {showPrivateKey ? trimKey(privateKey) : '••••••••••••••••••••••••••••••••'}
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyClick('private')}
                    className="text-gray-400 hover:text-gray-300 p-1"
                    title={copied.private ? "Copied!" : "Copy private key"}
                  >
                    <FaCopy size={16} className={copied.private ? "text-green-400" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-gray-400 hover:text-gray-300 p-1"
                  >
                    {showPrivateKey ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WalletDetailsModal;