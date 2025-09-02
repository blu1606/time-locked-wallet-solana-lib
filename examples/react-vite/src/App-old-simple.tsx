/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
// Buffer polyfill for browser
import { Buffer } from 'buffer';
if (typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { TimeLockClient } from '@time-locked-wallet/core';
import { 
  TimeLockProvider,
  LockCreationForm,
  LockInfoCard,
  LocksList,
  WithdrawButton
} from '@time-locked-wallet/react';

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

  const connect = async () => {
    if (!(window as any).solana?.isPhantom) {
      alert('Phantom wallet not found! Please install Phantom.');
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
      alert('Error connecting wallet: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  return { wallet, connect, connecting, client };
};

// Wallet connection component
const WalletConnection: React.FC<{
  wallet: WalletInfo | null;
  connect: () => void;
  connecting: boolean;
}> = ({ wallet, connect, connecting }) => {
  if (!wallet) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '8px' }}>
        <h2>🔗 Connect Wallet</h2>
        <button onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #28a745', margin: '10px', borderRadius: '8px', backgroundColor: '#d4edda' }}>
      <h2>✅ Wallet Connected</h2>
      <p><strong>Address:</strong> {wallet.publicKey.toString().slice(0, 8)}...{wallet.publicKey.toString().slice(-8)}</p>
    </div>
  );
};

// Main App component
function App() {
  const { wallet, connect, connecting, client } = useWallet();
  const [selectedLock, setSelectedLock] = useState<string>('');

  const connection = new Connection(RPC_URL);
  const config = {
    programId: PROGRAM_ID.toString(),
    cluster: 'localhost' as const
  };

  const handleLockCreated = (address: string) => {
    setSelectedLock(address);
    alert(`Lock created successfully! Address: ${address.slice(0, 8)}...${address.slice(-8)}`);
  };

  const handleWithdrawSuccess = (signature: string) => {
    alert(`Withdrawal successful! Transaction: ${signature}`);
    setSelectedLock('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>🔒 Time-Locked Wallet Demo</h1>
      <p>Using React components from @time-locked-wallet/react package</p>

      {/* Wallet Connection */}
      <WalletConnection wallet={wallet} connect={connect} connecting={connecting} />

      {wallet && client && (
        <TimeLockProvider connection={connection} config={config} client={client}>
          {/* Create Lock Form */}
          <div style={{ padding: '20px', border: '1px solid #007bff', margin: '10px', borderRadius: '8px' }}>
            <LockCreationForm
              walletAddress={wallet.publicKey.toString()}
              onLockCreated={handleLockCreated}
              className="create-lock-section"
            />
          </div>

          {/* Selected Lock Info */}
          {selectedLock && (
            <div style={{ padding: '20px', border: '1px solid #6c757d', margin: '10px', borderRadius: '8px' }}>
              <h2>Selected Lock Information</h2>
              <LockInfoCard 
                lockAddress={selectedLock}
                className="lock-info-section"
              />
              <div style={{ marginTop: '20px' }}>
                <WithdrawButton
                  lockAddress={selectedLock}
                  onWithdrawSuccess={handleWithdrawSuccess}
                  className="withdraw-section"
                />
              </div>
            </div>
          )}

          {/* User Locks List */}
          <div style={{ padding: '20px', border: '1px solid #fd7e14', margin: '10px', borderRadius: '8px' }}>
            <LocksList
              userAddress={wallet.publicKey}
              onLockSelect={(lockAddress) => setSelectedLock(lockAddress.toString())}
              onWithdrawSuccess={handleWithdrawSuccess}
              className="locks-list-section"
            />
          </div>
        </TimeLockProvider>
      )}

      {!wallet && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
          <p>Please connect your wallet to interact with Time-Locked Wallet features.</p>
        </div>
      )}
    </div>
  );
}

export default App;
