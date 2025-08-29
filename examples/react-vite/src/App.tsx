/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletInfo {
  publicKey: any;
}

interface LockData {
  owner: string;
  amount: number;
  unlockTime: number;
  created: number;
}

declare var window: any;
declare var alert: any;

// Wallet connection hook
const useWallet = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Please install Phantom.');
      return;
    }

    try {
      setConnecting(true);
      const response = await window.solana.connect();
      setWallet(response);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.solana && window.solana.isPhantom) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            setWallet(response);
          }
        } catch (error) {
          // Not connected yet
        }
      }
    };
    checkConnection();
  }, []);

  return { wallet, connect, connecting };
};

// Wallet component
const WalletConnection: React.FC<{ wallet: WalletInfo | null; connect: () => void; connecting: boolean }> = ({ wallet, connect, connecting }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  useEffect(() => {
    if (wallet) {
      const getBalance = async () => {
        try {
          const bal = await connection.getBalance(wallet.publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error getting balance:', error);
        }
      };
      getBalance();
    }
  }, [wallet, connection]);

  if (!wallet) {
    return (
      <div className="card">
        <h2>1. Connect Wallet</h2>
        <button onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
        </button>
      </div>
    );
  }

  const address = wallet.publicKey.toString();
  return (
    <div className="card">
      <h2>✅ Wallet Connected</h2>
      <div className="info-card">
        <p><strong>Address:</strong> {address.slice(0, 8)}...{address.slice(-8)}</p>
        <p><strong>Balance:</strong> {balance?.toFixed(4) || 'Loading...'} SOL</p>
      </div>
    </div>
  );
};

// Create lock form
const CreateLockForm: React.FC<{ wallet: WalletInfo | null; onLockCreated: (address: string) => void }> = ({ wallet, onLockCreated }) => {
  const [amount, setAmount] = useState('0.1');
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default values
    const today = new Date().toISOString().split('T')[0];
    setUnlockDate(today);
    
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    const timeString = oneHourLater.toTimeString().slice(0, 5);
    setUnlockTime(timeString);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet) {
      setStatus('Please connect your wallet first');
      return;
    }

    const unlockDateTime = new Date(`${unlockDate}T${unlockTime}`);
    if (unlockDateTime <= new Date()) {
      setStatus('Unlock time must be in the future');
      return;
    }

    try {
      setLoading(true);
      setStatus('Creating time-locked wallet...');
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock lock address
      const mockLockAddress = new PublicKey(Math.floor(Math.random() * 1000000000)).toString();
      
      // Store in localStorage for demo
      const lockData: LockData = {
        owner: wallet.publicKey.toString(),
        amount: parseFloat(amount),
        unlockTime: unlockDateTime.getTime(),
        created: Date.now()
      };
      localStorage.setItem(`lock_${mockLockAddress}`, JSON.stringify(lockData));
      
      setStatus('Lock created successfully!');
      onLockCreated(mockLockAddress);
      
    } catch (error: any) {
      setStatus(`Error creating lock: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="card">
        <h2>2. Create Time-Locked Wallet</h2>
        <p>Please connect your wallet first.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>2. Create Time-Locked Wallet</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount (SOL):</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={(e) => setAmount((e.currentTarget as any).value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Unlock Date:</label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate((e.currentTarget as any).value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div className="form-group">
          <label>Unlock Time:</label>
          <input
            type="time"
            value={unlockTime}
            onChange={(e) => setUnlockTime((e.currentTarget as any).value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Lock'}
        </button>
        <div className="status">{status}</div>
      </form>
    </div>
  );
};

// Lock info component
const LockInfo: React.FC<{ lockAddress: string; wallet: WalletInfo | null }> = ({ lockAddress, wallet }) => {
  const [lockData, setLockData] = useState<LockData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!lockAddress) {
      setLockData(null);
      return;
    }

    const loadLockData = () => {
      const data = localStorage.getItem(`lock_${lockAddress}`);
      if (data) {
        setLockData(JSON.parse(data));
      } else {
        setLockData(null);
      }
    };

    loadLockData();
  }, [lockAddress]);

  useEffect(() => {
    if (!lockData) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = lockData.unlockTime - now;

      if (remaining <= 0) {
        setTimeRemaining('Ready to withdraw!');
        return;
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockData]);

  if (!lockAddress) {
    return (
      <div className="card">
        <h2>3. Lock Information</h2>
        <p>Create a lock above to see information here.</p>
      </div>
    );
  }

  if (!lockData) {
    return (
      <div className="card">
        <h2>3. Lock Information</h2>
        <div className="error">Lock not found or invalid address</div>
      </div>
    );
  }

  const isUnlocked = Date.now() >= lockData.unlockTime;
  const isOwner = wallet && wallet.publicKey.toString() === lockData.owner;

  return (
    <div className="card">
      <h2>3. Lock Information</h2>
      <div className="info-card">
        <h3>Lock Details</h3>
        <p><strong>Address:</strong> {lockAddress.slice(0, 8)}...{lockAddress.slice(-8)}</p>
        <p><strong>Owner:</strong> {lockData.owner.slice(0, 8)}...{lockData.owner.slice(-8)}</p>
        <p><strong>Amount:</strong> {lockData.amount} SOL</p>
        <p><strong>Unlock Time:</strong> {new Date(lockData.unlockTime).toLocaleString()}</p>
        <p><strong>Status:</strong> {isUnlocked ? 'Unlocked ✅' : 'Locked 🔒'}</p>
        <p><strong>Time Remaining:</strong> 
          <span style={{ color: isUnlocked ? '#28a745' : '#007bff' }}>
            {timeRemaining}
          </span>
        </p>
        {!isOwner && <p style={{ color: '#dc3545' }}>⚠️ You are not the owner of this lock</p>}
      </div>
    </div>
  );
};

// Withdraw component
const WithdrawSection: React.FC<{ lockAddress: string; wallet: WalletInfo | null; onWithdraw: () => void }> = ({ lockAddress, wallet, onWithdraw }) => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const lockDataStr = lockAddress ? localStorage.getItem(`lock_${lockAddress}`) : null;
  const lockData: LockData | null = lockDataStr ? JSON.parse(lockDataStr) : null;
  const isUnlocked = lockData && Date.now() >= lockData.unlockTime;
  const isOwner = lockData && wallet && wallet.publicKey.toString() === lockData.owner;
  const canWithdraw = isUnlocked && isOwner;

  const handleWithdraw = async () => {
    if (!canWithdraw) return;

    try {
      setLoading(true);
      setStatus('Processing withdrawal...');
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove from localStorage
      localStorage.removeItem(`lock_${lockAddress}`);
      
      setStatus('Withdrawal successful! Funds sent to your wallet.');
      onWithdraw();
      
    } catch (error: any) {
      setStatus(`Error withdrawing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  let buttonText = 'Withdraw Funds';
  if (!wallet) buttonText = 'Connect Wallet';
  else if (!lockData) buttonText = 'No Lock Selected';
  else if (!isOwner) buttonText = 'Not Owner';
  else if (!isUnlocked) buttonText = 'Still Locked';

  return (
    <div className="card">
      <h2>4. Withdraw</h2>
      <button 
        onClick={handleWithdraw} 
        disabled={!canWithdraw || loading}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
      <div className="status">{status}</div>
    </div>
  );
};

// Main App
function App() {
  const { wallet, connect, connecting } = useWallet();
  const [currentLockAddress, setCurrentLockAddress] = useState('');

  const handleLockCreated = (address: string) => {
    setCurrentLockAddress(address);
  };

  const handleWithdraw = () => {
    setCurrentLockAddress('');
  };

  return (
    <div className="container">
      <h1>🔒 Time-Locked Wallet React Demo</h1>
      <p>This demonstrates using React hooks with the Time-Locked Wallet Solana program.</p>
      
      <WalletConnection 
        wallet={wallet} 
        connect={connect} 
        connecting={connecting} 
      />
      
      <CreateLockForm 
        wallet={wallet} 
        onLockCreated={handleLockCreated} 
      />
      
      <LockInfo 
        lockAddress={currentLockAddress} 
        wallet={wallet} 
      />
      
      <WithdrawSection 
        lockAddress={currentLockAddress} 
        wallet={wallet} 
        onWithdraw={handleWithdraw} 
      />
    </div>
  );
}

export default App;
