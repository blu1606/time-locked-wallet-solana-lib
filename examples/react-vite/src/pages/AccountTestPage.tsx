import React, { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Inline implementation of balance hook
const useBalance = (connection: Connection | null, address: PublicKey | null) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!connection || !address) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balanceValue = await connection.getBalance(address);
      setBalance(balanceValue / LAMPORTS_PER_SOL);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { balance, isLoading, error, refresh };
};

// Inline implementation of airdrop hook
const useAirdrop = (connection: Connection | null, address: PublicKey | null) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const requestAirdrop = useCallback(async (amount: number = 1): Promise<string | null> => {
    if (!connection || !address) {
      setError('Connection or address not available');
      return null;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const amountLamports = amount * LAMPORTS_PER_SOL;
      console.log(`🎯 Requesting ${amount} SOL airdrop for ${address.toString()}`);
      
      const signature = await connection.requestAirdrop(address, amountLamports);
      console.log('📤 Airdrop signature:', signature);
      
      setLastSignature(signature);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash
      }, 'confirmed');
      
      console.log('✅ Airdrop confirmed!');
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Airdrop failed';
      setError(errorMessage);
      console.error('❌ Airdrop failed:', err);
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, [connection, address]);

  return { requestAirdrop, isRequesting, error, lastSignature };
};

// Mock connection for testing
const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

const AccountTestPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [currentAddress, setCurrentAddress] = useState<PublicKey | null>(null);
  const [airdropAmount, setAirdropAmount] = useState<number>(1);

  const { balance, isLoading, error, refresh } = useBalance(connection, currentAddress);
  const { requestAirdrop, isRequesting, error: airdropError, lastSignature } = useAirdrop(connection, currentAddress);

  const handleAddressSubmit = () => {
    try {
      if (walletAddress.trim()) {
        const pubkey = new PublicKey(walletAddress.trim());
        setCurrentAddress(pubkey);
      }
    } catch (error) {
      alert('Invalid wallet address!');
    }
  };

  const handleAirdrop = async () => {
    const signature = await requestAirdrop(airdropAmount);
    if (signature) {
      alert(`🎉 Airdrop successful! Signature: ${signature.slice(0, 8)}...`);
      refresh(); // Refresh balance after successful airdrop
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🧪 Account Balance & Airdrop Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Enter Wallet Address</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana wallet address..."
            style={{ 
              flex: 1, 
              padding: '8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddressSubmit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Set Address
          </button>
        </div>
        
        <div style={{ fontSize: '12px', color: '#666' }}>
          Current: {currentAddress ? currentAddress.toString() : 'None'}
        </div>
      </div>

      {currentAddress && (
        <>
          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3>💰 Account Balance</h3>
              <button
                onClick={refresh}
                disabled={isLoading}
                style={{
                  padding: '5px 10px',
                  backgroundColor: isLoading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {error ? (
              <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>
            ) : (
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>🎁 Request Airdrop</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Amount (SOL):
              </label>
              <input
                type="number"
                value={airdropAmount}
                onChange={(e) => setAirdropAmount(Number(e.target.value))}
                min="0.1"
                max="5"
                step="0.1"
                style={{ 
                  width: '100px', 
                  padding: '5px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            <button
              onClick={handleAirdrop}
              disabled={isRequesting}
              style={{
                padding: '10px 15px',
                backgroundColor: isRequesting ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRequesting ? 'not-allowed' : 'pointer',
                marginBottom: '10px'
              }}
            >
              {isRequesting ? 'Requesting...' : `Request ${airdropAmount} SOL`}
            </button>
            
            {airdropError && (
              <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
                {airdropError}
              </div>
            )}
            
            {lastSignature && (
              <div style={{ color: 'green', fontSize: '14px', marginTop: '10px' }}>
                Last signature: {lastSignature.slice(0, 8)}...
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>📝 Instructions:</p>
        <ul>
          <li>Make sure you have a local Solana validator running on port 8899</li>
          <li>Enter a valid Solana wallet address</li>
          <li>Check the balance (should auto-refresh every 5 seconds)</li>
          <li>Request an airdrop to add SOL to the account</li>
          <li>Watch the balance update after successful airdrop</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountTestPage;
