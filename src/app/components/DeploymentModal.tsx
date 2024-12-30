import * as Dialog from '@radix-ui/react-dialog';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAddress?: string;
  landingPageUrl?: string;
}

export default function DeploymentModal({
  isOpen,
  onClose,
  tokenAddress,
  landingPageUrl,
}: DeploymentModalProps) {
  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg p-6 w-[400px]">
          <Dialog.Title className="text-xl text-white mb-4">
            Token Deployed Successfully! 🎉
          </Dialog.Title>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Token Address:</p>
              <p className="text-white bg-gray-800 p-2 rounded text-sm font-mono break-all">
                {tokenAddress}
              </p>
            </div>
            <div className="flex flex-col gap-3">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 