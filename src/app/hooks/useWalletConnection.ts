import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState, useRef } from 'react';
import { getClientToken } from '../utils/clientToken';
import { toast } from 'sonner';
import bs58 from 'bs58';

export const useWalletConnection = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previouslyConnected, setPreviouslyConnected] = useState(false);
  const hasAttemptedConnection = useRef(false);

  // Handle wallet disconnection
  useEffect(() => {
    if (previouslyConnected && !connected) {
      localStorage.removeItem('clientToken');
      getClientToken();
      window.location.reload();
    }
    setPreviouslyConnected(connected);
  }, [connected, previouslyConnected]);

  useEffect(() => {
    const connectWallet = async () => {
      // Only attempt connection once when wallet is first connected
      if (!connected || !publicKey || !signMessage || hasAttemptedConnection.current || isConnecting) {
        return;
      }

      try {
        hasAttemptedConnection.current = true;
        setIsConnecting(true);
        setError(null);
        
        const challengeResponse = await fetch('/api/auth/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: publicKey.toString() }),
        });

        const { message } = await challengeResponse.json();
        if (!challengeResponse.ok) {
          throw new Error('Failed to get challenge message');
        }

        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        const clientToken = getClientToken();
        const signatureString = bs58.encode(signature);

        const response = await fetch('/api/connect-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
            clientToken,
            signature: signatureString,
            message,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.clientToken && data.clientToken !== clientToken) {
            localStorage.setItem('clientToken', data.clientToken);
            toast.success('Connected to existing account');
            window.location.reload();
            return;
          }
          
          setError(data.error || 'Failed to connect wallet');
          toast.error(data.error || 'Failed to connect wallet');
        } else {
          toast.success('Wallet connected successfully');
        }
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setError('Failed to connect wallet');
        toast.error('Failed to connect wallet');
        hasAttemptedConnection.current = false; // Reset on error to allow retry
      } finally {
        setIsConnecting(false);
      }
    };

    connectWallet();
  }, [connected, publicKey, signMessage]);

  return {
    isConnecting,
    error,
  };
}; 