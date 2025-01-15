import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getClientToken } from '../utils/clientToken';
import { toast } from 'sonner';
import bs58 from 'bs58';

export const useWalletConnection = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          console.error('API error:', data);
          setError(data.error || 'Failed to connect wallet');
          // If the wallet is already connected to a different client token,
          // update the local storage with that token
          if (data.clientToken) {
            console.log('Updating client token:', data.clientToken);
            localStorage.setItem('clientToken', data.clientToken);
            toast.success('Using existing account for this wallet');
          } else {
            toast.error(data.error || 'Failed to connect wallet');
          }
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