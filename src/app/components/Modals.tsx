import { motion, AnimatePresence } from 'framer-motion';

interface Bot {
  id: string;
  name: string;
  imageUrl: string;
  personality: string;
  background: string;
}

interface DeploymentModalProps {
  isOpen: boolean;
  tokenAddress?: string;
  landingPageUrl?: string;
  onClose: () => void;
}

interface EditBotModalProps {
  isOpen: boolean;
  bot: Bot | null;
  onClose: () => void;
  onSubmit: (bot: Bot) => void;
}

export function DeploymentModal({ 
  isOpen, 
  tokenAddress, 
  landingPageUrl, 
  onClose 
}: DeploymentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Token Deployed Successfully! 🎉</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Token Address:</p>
                <p className="text-white bg-gray-800 p-2 rounded text-sm font-mono break-all">
                  {tokenAddress}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-gray-500 text-sm italic">
                  Token creation may take up to 2 minutes to appear in pump.fun
                </p>
                <div className="flex justify-end gap-3">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EditBotModal({ 
  isOpen, 
  bot, 
  onClose, 
  onSubmit 
}: EditBotModalProps) {
  return (
    <AnimatePresence>
      {isOpen && bot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Edit Bot Settings</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedBot = {
                  ...bot,
                  name: formData.get('name') as string,
                  personality: formData.get('personality') as string,
                  background: formData.get('background') as string,
                };
                onSubmit(updatedBot);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={bot.name}
                  className="w-full bg-gray-800 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Personality</label>
                <textarea
                  name="personality"
                  defaultValue={bot.personality}
                  className="w-full bg-gray-800 rounded p-2 text-white h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Background</label>
                <textarea
                  name="background"
                  defaultValue={bot.background}
                  className="w-full bg-gray-800 rounded p-2 text-white h-24"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 