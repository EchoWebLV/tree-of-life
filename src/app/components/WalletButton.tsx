'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const { connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="wallet-button-container pointer-events-auto">
      <WalletMultiButton className={`wallet-button ${connected ? 'connected' : ''}`} />
      <style jsx global>{`
        .wallet-button {
          background-color: #2A5E1C !important;
          background-image: linear-gradient(to bottom, #4a934c, #2A5E1C) !important;
          border: 2px solid #2A5E1C !important;
          color: #E8DAB2 !important;
          height: 40px !important;
          border-radius: 8px !important;
          font-family: 'Press Start 2P', Arial, Helvetica, sans-serif !important;
          cursor: pointer !important;
          z-index: 50 !important;
          image-rendering: pixelated !important;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.3) !important;
          transition: all 0.2s ease !important;
          font-size: 12px !important;
          padding: 0 16px !important;
        }
        
        .wallet-button:hover {
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,0.3) !important;
          transform: scale(0.98) !important;
        }

        .wallet-button.connected {
          background-color: #4a934c !important;
          border-color: #2A5E1C !important;
        }

        .wallet-adapter-dropdown-list {
          background-color: #2A5E1C !important;
          border: 2px solid #4a934c !important;
          border-radius: 8px !important;
          box-shadow: 4px 4px 0px 0px rgba(0,0,0,0.3) !important;
          image-rendering: pixelated !important;
          z-index: 51 !important;
          overflow: hidden !important;
        }

        .wallet-adapter-dropdown-list-item {
          color: #E8DAB2 !important;
          cursor: pointer !important;
          font-family: 'Press Start 2P', Arial, Helvetica, sans-serif !important;
          background-color: transparent !important;
          border-radius: 0 !important;
          padding: 8px 16px !important;
          font-size: 12px !important;
          border-bottom: 2px solid #4a934c !important;
        }

        .wallet-adapter-dropdown-list-item:last-child {
          border-bottom: none !important;
        }

        .wallet-adapter-dropdown-list-item:hover {
          background-color: #4a934c !important;
        }

        .wallet-adapter-modal-wrapper {
          background-color: #2A5E1C !important;
          border: 2px solid #4a934c !important;
          border-radius: 8px !important;
          font-family: 'Press Start 2P', Arial, Helvetica, sans-serif !important;
          image-rendering: pixelated !important;
        }

        .wallet-adapter-button {
          color: #E8DAB2 !important;
          font-family: 'Press Start 2P', Arial, Helvetica, sans-serif !important;
        }

        .wallet-adapter-modal-title {
          color: #E8DAB2 !important;
          font-family: 'Press Start 2P', Arial, Helvetica, sans-serif !important;
        }

        .wallet-adapter-modal-list {
          margin: 0 0 4px !important;
        }

        .wallet-adapter-modal-list li:not(:first-of-type) {
          margin-top: 4px !important;
        }
      `}</style>
    </div>
  );
}
