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
          background-color: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: white !important;
          height: 40px !important;
          border-radius: 8px !important;
          font-family: inherit !important;
          cursor: pointer !important;
          z-index: 50 !important;
        }
        .wallet-button.connected {
          background-color: rgba(0, 255, 0, 0.1) !important;
          border-color: rgba(0, 255, 0, 0.2) !important;
        }
        .wallet-button:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
        .wallet-adapter-dropdown-list {
          background-color: #1a1a1a !important;
          z-index: 51 !important;
        }
        .wallet-adapter-dropdown-list-item {
          color: white !important;
          cursor: pointer !important;
          background-color: #1a1a1a !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          font-size: 14px !important;
        }
        .wallet-adapter-dropdown-list-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .wallet-adapter-modal-wrapper {
          background-color: #1a1a1a !important;
        }
        .wallet-adapter-button {
          color: white !important;
        }
        .wallet-adapter-modal-title {
          color: white !important;
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
