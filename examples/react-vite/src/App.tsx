/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
// Buffer polyfill for browser
import { Buffer } from 'buffer';
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

import { Connection, PublicKey } from '@solana/web3.js';
import { TimeLockClient } from '@time-locked-wallet/core';
import { 
  TimeLockProvider,
  Navigation,
  Button,
  Card,
  Modal,
  Token
} from '@time-locked-wallet/react';

// Pages
import CreateLockPage from './pages/CreateLockPage';
import DashboardPage from './pages/DashboardPage';
import AccountTestPage from './pages/AccountTestPage';

// Types
interface WalletInfo {
  publicKey: PublicKey;
}

// Configuration
const RPC_URL = import.meta.env?.VITE_SOLANA_RPC_URL || 'http://127.0.0.1:8899';
const PROGRAM_ID = new PublicKey('Cbrwi9hDB1bQ9fhAqJDPMHxTmXNkGq96Z7KZXjXQJ3dB');

// Custom wallet hook
const useWallet = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [client, setClient] = useState<TimeLockClient | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const connect = async () => {
    if (!(window as any).solana?.isPhantom) {
      setShowWalletModal(true);
      return;
    }

    try {
      setConnecting(true);
      const response = await (window as any).solana.connect();
      setWallet({ publicKey: response.publicKey });

      // Initialize client
      const connection = new Connection(RPC_URL);
      const anchorWallet = {
        publicKey: response.publicKey,
        signTransaction: (window as any).solana.signTransaction,
        signAllTransactions: (window as any).solana.signAllTransactions,
        payer: response.publicKey,
      };

      const timeLockClient = new TimeLockClient(connection, anchorWallet, PROGRAM_ID);
      setClient(timeLockClient);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(null);
    setClient(null);
    if ((window as any).solana) {
      (window as any).solana.disconnect();
    }
  };

  return { wallet, connect, disconnect, connecting, client, showWalletModal, setShowWalletModal };
};

// Wallet Connection Modal
const WalletModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  connecting: boolean;
}> = ({ isOpen, onClose, onConnect, connecting }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kết nối ví"
      size="sm"
    >
      <div className="text-center space-y-6">
        <div>
          <img
            src="https://phantom.app/img/phantom-logo.png"
            alt="Phantom"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Kết nối với Phantom Wallet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Vui lòng cài đặt và sử dụng Phantom Wallet để truy cập ứng dụng
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={onConnect}
            loading={connecting}
            fullWidth
            variant="primary"
          >
            {connecting ? 'Đang kết nối...' : 'Kết nối Phantom'} 
          </Button>
          
          <Button
            onClick={() => window.open('https://phantom.app', '_blank')}
            fullWidth
            variant="secondary"
          >
            Cài đặt Phantom Wallet
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Wallet Button Component
const WalletButton: React.FC<{
  wallet: WalletInfo | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}> = ({ wallet, onConnect, onDisconnect, connecting }) => {
  if (!wallet) {
    return (
      <Button
        onClick={onConnect}
        loading={connecting}
        variant="primary"
      >
        {connecting ? 'Đang kết nối...' : 'Kết nối ví'}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {wallet.publicKey.toString().slice(0, 4)}...{wallet.publicKey.toString().slice(-4)}
      </span>
      <Button
        onClick={onDisconnect}
        variant="secondary"
        size="sm"
      >
        Ngắt kết nối
      </Button>
    </div>
  );
};

// Main App component
function App() {
  const { wallet, connect, disconnect, connecting, client, showWalletModal, setShowWalletModal } = useWallet();
  const [currentPage, setCurrentPage] = useState<'create' | 'dashboard'>('create');
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Default to system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const connection = new Connection(RPC_URL);
  const config = {
    programId: PROGRAM_ID.toString(),
    cluster: 'localhost' as const
  };

  const renderPage = () => {
    if (!wallet) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="text-center max-w-md w-full mx-4" padding="lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🔒 Time-Locked Wallet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Khóa tiền với thời gian mở khóa cụ thể trên Solana
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ✨ Tính năng chính
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
                  <li>• Khóa SOL với thời gian tùy chỉnh</li>
                  <li>• Giao diện đẹp, dark mode</li>
                  <li>• Dashboard theo dõi realtime</li>
                  <li>• Rút tiền tự động khi hết hạn</li>
                </ul>
              </div>

              <Button
                onClick={connect}
                loading={connecting}
                fullWidth
                size="lg"
                variant="primary"
              >
                {connecting ? 'Đang kết nối...' : 'Bắt đầu - Kết nối ví'}
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    switch (currentPage) {
      case 'create':
        return <CreateLockPage wallet={wallet} client={client} />;
      case 'dashboard':
        return <DashboardPage wallet={wallet} client={client} />;
      default:
        return <CreateLockPage wallet={wallet} client={client} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {wallet && client && (
        <TimeLockProvider connection={connection} config={config} client={client}>
          <Navigation
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            walletButton={
              <WalletButton
                wallet={wallet}
                onConnect={connect}
                onDisconnect={disconnect}
                connecting={connecting}
              />
            }
          />
        </TimeLockProvider>
      )}
      
      <main>
        {wallet && client ? (
          <TimeLockProvider connection={connection} config={config} client={client}>
            {renderPage()}
          </TimeLockProvider>
        ) : (
          renderPage()
        )}
      </main>

      {/* Wallet Connection Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connect}
        connecting={connecting}
      />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#374151' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
