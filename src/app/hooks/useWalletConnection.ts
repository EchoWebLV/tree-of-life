import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getClientToken } from '../utils/clientToken';
import { toast } from 'sonner';
import bs58 from 'bs58';

export const useWalletConnection = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previouslyConnected, setPreviouslyConnected] = useState(false);

  // Handle wallet disconnection
  useEffect(() => {
    if (previouslyConnected && !connected) {
      console.log('Wallet disconnected, cleaning up clientToken');
      localStorage.removeItem('clientToken');
      // Generate a new client token for the anonymous session
      getClientToken();
      // Reload page to refresh state
      window.location.reload();
    }
    setPreviouslyConnected(connected);
  }, [connected, previouslyConnected]);

  useEffect(() => {
    const connectWallet = async () => {
      if (!connected || !publicKey || !signMessage || isConnecting) {
        console.log('Skipping wallet connection:', { connected, publicKey: publicKey?.toString(), isConnecting });
        return;
      }

      try {
        console.log('Requesting challenge for wallet:', publicKey.toString());
        setIsConnecting(true);
        setError(null);
        
        // Get challenge message
        const challengeResponse = await fetch('/api/auth/challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
          }),
        });

        const { message } = await challengeResponse.json();
        if (!challengeResponse.ok) {
          throw new Error('Failed to get challenge message');
        }

        // Sign the message
        console.log('Signing message:', message);
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);
        const clientToken = getClientToken();

        // Convert the signature to bs58 format
        const signatureString = bs58.encode(signature);
        console.log('Signature:', signatureString);

        console.log('Making API request with:', { clientToken, walletAddress: publicKey.toString() });
        const response = await fetch('/api/connect-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
            clientToken,
            signature: signatureString,
            message,
          }),
        });

        const data = await response.json();
        console.log('API response:', data);

        if (!response.ok) {
          if (data.clientToken && data.clientToken !== clientToken) {
            // If the wallet is already associated with a different client token,
            // switch to using that token
            console.log('Switching to existing client token:', data.clientToken);
            localStorage.setItem('clientToken', data.clientToken);
            toast.success('Connected to existing account');
            // Reload the page to refresh data with new client token
            window.location.reload();
            return;
          }
          
          console.error('API error:', data);
          setError(data.error || 'Failed to connect wallet');
          toast.error(data.error || 'Failed to connect wallet');
        } else {
          console.log('Wallet connected successfully');
          toast.success('Wallet connected successfully');
        }
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setError('Failed to connect wallet');
        toast.error('Failed to connect wallet');
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