import * as Dialog from '@radix-ui/react-dialog';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import WalletButton from './WalletButton';
import { useEffect } from 'react';

interface TokenRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredTokens: number;
}

export default function TokenRequirementModal({
  isOpen,
  onClose,
  feature,
  requiredTokens
}: TokenRequirementModalProps) {
  const { connected } = useWallet();
  const { visible } = useWalletModal();

  // Close requirement modal when wallet modal opens
  useEffect(() => {
    if (visible && isOpen) {
      onClose();
    }
  }, [visible, isOpen, onClose]);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 49 }} />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]"
          style={{ zIndex: 49 }}
        >
          <Dialog.Title className="text-xl text-white mb-4">
            Token Requirement
          </Dialog.Title>
          <div className="space-y-4">
            <p className="text-gray-300">
              To use the {feature} feature, you need:
            </p>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-white text-lg font-semibold">{requiredTokens.toLocaleString()} DRU Tokens</p>
            </div>
            {!connected && (
              <div className="mt-4">
                <p className="text-gray-400 mb-2">Connect your wallet to continue:</p>
                <div className="flex justify-center" style={{ zIndex: 50 }}>
                  <WalletButton />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
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
} 