import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

  useEffect(() => {
    if (!isOpen) {
      setShowPrivateKey(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowPrivateKey(false);
    onClose();
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
              <div className="w-full bg-gray-800 rounded p-2 text-white font-mono text-sm break-all">
                {publicKey}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Private Key</label>
              <div className="relative">
                <div className="w-full bg-gray-800 rounded p-2 text-white font-mono text-sm break-all">
                  {showPrivateKey ? privateKey : '••••••••••••••••••••••••••••••••'}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPrivateKey ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
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