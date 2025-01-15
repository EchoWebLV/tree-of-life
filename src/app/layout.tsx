'use client';

import './globals.css';
import { Toaster } from 'sonner';
import ClientWalletProvider from './components/WalletProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientWalletProvider>
          {children}
          <Toaster position="top-right" />
        </ClientWalletProvider>
      </body>
    </html>
  );
}
