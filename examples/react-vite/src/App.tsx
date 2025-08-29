/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
// Buffer polyfill for browser (required by @solana/web3.js PublicKey internals)
import { Buffer } from 'buffer';
if (typeof (window as any).Buffer === 'undefined') {
  // @ts-ignore
  window.Buffer = Buffer;
}
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TimeLockClient, AssetType } from '@time-locked-wallet/core';
import * as anchor from '@coral-xyz/anchor';

interface WalletInfo {
  publicKey: PublicKey;
}

interface LockData {
  owner: string;
  amount: number;
  unlockTime: number;
  created: number;
  lockAddress: string;
}

// RPC URL (read from Vite env, fallback to devnet)
const rpcUrl = (import.meta as any).env?.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet');

// Connection và client setup
const connection = new Connection(rpcUrl);

// TimeLock context
const TimeLockContext = React.createContext<{
  client: TimeLockClient | null;
  wallet: WalletInfo | null;
}>({
  client: null,
  wallet: null,
});

declare var window: any;
declare var alert: any;

// Wallet connection hook
const useWallet = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [client, setClient] = useState<TimeLockClient | null>(null);

  const connect = async () => {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Please install Phantom.');
      return;
    }

    try {
      setConnecting(true);
      const response = await window.solana.connect();
      const walletInfo = { publicKey: response.publicKey };
      setWallet(walletInfo);

      // Initialize TimeLockClient
      console.log('connect debug - response.publicKey:', response.publicKey);
      console.log('connect debug - response.publicKey type:', typeof response.publicKey);
      
      // Ensure we have a proper PublicKey instance
      const normalizedPublicKey = response.publicKey instanceof PublicKey 
        ? response.publicKey 
        : new PublicKey(response.publicKey.toString());
      
      const anchorWallet = {
        publicKey: normalizedPublicKey,
        signTransaction: window.solana.signTransaction,
        signAllTransactions: window.solana.signAllTransactions,
        payer: normalizedPublicKey, // Add payer property
      };
      
      console.log('connect debug - anchorWallet.publicKey:', anchorWallet.publicKey);
      console.log('connect debug - anchorWallet.publicKey._bn:', anchorWallet.publicKey._bn);
      
      const timeLockClient = new TimeLockClient(
        connection,
        anchorWallet,
        new PublicKey('899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g')
      );
      setClient(timeLockClient);
      
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
            // normalize wallet shape
            const walletInfo = { publicKey: response.publicKey };
            setWallet(walletInfo);

            // initialize client when already trusted
            try {
              console.log('checkConnection debug - response.publicKey:', response.publicKey);
              console.log('checkConnection debug - response.publicKey type:', typeof response.publicKey);
              console.log('checkConnection debug - response.publicKey instanceof PublicKey:', response.publicKey instanceof PublicKey);
              
              // Ensure we have a proper PublicKey instance
              let normalizedPublicKey: PublicKey;
              
              if (response.publicKey instanceof PublicKey) {
                normalizedPublicKey = response.publicKey;
              } else {
                // Try different ways to extract the public key
                let publicKeyString: string;
                
                if (typeof response.publicKey === 'string') {
                  publicKeyString = response.publicKey;
                } else if (response.publicKey && typeof response.publicKey.toString === 'function') {
                  publicKeyString = response.publicKey.toString();
                } else if (response.publicKey && response.publicKey._bn) {
                  // If it's a BN-like object, try to convert it to base58
                  try {
                    // If it has a toBase58 method, use it
                    if (typeof response.publicKey.toBase58 === 'function') {
                      publicKeyString = response.publicKey.toBase58();
                    } else {
                      // Try to create a PublicKey from the _bn property
                      publicKeyString = new PublicKey(response.publicKey._bn).toString();
                    }
                  } catch (bnError) {
                    console.error('Failed to convert _bn to PublicKey:', bnError);
                    throw new Error('Invalid PublicKey format from wallet');
                  }
                } else {
                  throw new Error('Unable to extract PublicKey from wallet response');
                }
                
                normalizedPublicKey = new PublicKey(publicKeyString);
              }
              
              const anchorWallet = {
                publicKey: normalizedPublicKey,
                signTransaction: window.solana.signTransaction,
                signAllTransactions: window.solana.signAllTransactions,
                payer: normalizedPublicKey,
              };
              
              console.log('checkConnection debug - anchorWallet.publicKey:', anchorWallet.publicKey);
              console.log('checkConnection debug - anchorWallet.publicKey._bn:', anchorWallet.publicKey._bn);
              
              const timeLockClient = new TimeLockClient(
                connection,
                anchorWallet,
                new PublicKey('899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g')
              );
              setClient(timeLockClient);
            } catch (err) {
              // non-fatal; client may be unavailable until explicit connect
              console.warn('Could not initialize TimeLockClient on trusted connect', err);
            }
          }
        } catch (error) {
          // Not connected yet
        }
      }
    };
    checkConnection();
  }, []);

  return { wallet, connect, connecting, client };
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
const CreateLockForm: React.FC<{ 
  wallet: WalletInfo | null; 
  client: TimeLockClient | null;
  onLockCreated: (address: string) => void 
}> = ({ wallet, client, onLockCreated }) => {
  const [amount, setAmount] = useState('0.1');
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default values: prefer authoritative chain time (use the existing devnet connection) + 30s, fallback to local time
    const setDefaults = async () => {
      try {
        // Use the top-level `connection` which is already configured for devnet
        const chainConn = connection;
        const slot = await chainConn.getSlot();
        const chainTime = await chainConn.getBlockTime(slot); // seconds
        let baseMs = Date.now();
        if (typeof chainTime === 'number') baseMs = chainTime * 1000;

        const unlockMs = baseMs + 30 * 1000; // 30 seconds after chain time
        const d = new Date(unlockMs);
        setUnlockDate(d.toISOString().split('T')[0]);
        setUnlockTime(d.toTimeString().slice(0, 5));
        return;
      } catch (err) {
        // ignore and fall back to local time
      }

      const today = new Date().toISOString().split('T')[0];
      setUnlockDate(today);
      const thirtySecLater = new Date(Date.now() + 30 * 1000);
      setUnlockTime(thirtySecLater.toTimeString().slice(0, 5));
    };

    setDefaults();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet || !client) {
      setStatus('Please connect your wallet first');
      return;
    }

    const unlockDateTime = new Date(`${unlockDate}T${unlockTime}`);
    if (unlockDateTime <= new Date()) {
      setStatus('Unlock time must be in the future');
      return;
    }

    // Use chain time as authoritative check where possible (protect against local clock skew)
    let finalUnlockTimestamp = Math.floor(unlockDateTime.getTime() / 1000);
    try {
      try {
        const slot = await connection.getSlot();
        const chainTime = await connection.getBlockTime(slot);
        if (typeof chainTime === 'number' && finalUnlockTimestamp <= chainTime) {
          // auto-bump to chainTime + 30s to avoid Anchor InvalidTimestamp
          finalUnlockTimestamp = chainTime + 30;
          const bumpedMs = finalUnlockTimestamp * 1000;
          const d = new Date(bumpedMs);
          setUnlockDate(d.toISOString().split('T')[0]);
          setUnlockTime(d.toTimeString().slice(0, 5));
          setStatus(`Unlock time was behind chain time; bumped to ${d.toLocaleString()}`);
        }
      } catch (chainErr) {
        // ignore chain time check failures (network/endpoint may not support), fallback to local check above
      }
    } catch (tsErr) {
      // ignore timestamp parsing errors - already validated above
    }

    // Check if user has enough balance
    try {
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceInSOL = balance / LAMPORTS_PER_SOL;
      const amountToLock = parseFloat(amount);
      
      if (balanceInSOL < amountToLock) {
        setStatus(`Insufficient balance. You have ${balanceInSOL.toFixed(4)} SOL, need ${amountToLock} SOL`);
        return;
      }
    } catch (error) {
      setStatus('Error checking balance');
      return;
    }

    try {
      setLoading(true);
      setStatus('Creating time-locked wallet with Solana program...');

      // Use real TimeLockClient
  const unlockTimestamp = finalUnlockTimestamp;
      // --- DEBUG: inspect owner public key before calling client ---
      console.log('create debug - wallet.publicKey raw:', wallet?.publicKey);
      console.log('create debug - wallet.publicKey type:', typeof wallet?.publicKey);
      try {
        console.log('create debug - wallet.publicKey.toBase58():', wallet?.publicKey?.toBase58?.());
      } catch (e) {
        console.warn('create debug - could not toBase58 owner', e);
      }

      // Pre-validate owner PublicKey to provide clearer feedback
      try {
        const ownerPreview = new PublicKey(wallet!.publicKey);
        console.log('create debug - owner PublicKey OK:', ownerPreview.toBase58());
      } catch (e: any) {
        console.error('create debug - invalid owner public key:', wallet?.publicKey, e);
        setStatus('Invalid owner public key: ' + String(e));
        setLoading(false);
        return;
      }

      // Additional debug: log the exact params being passed to createSolTimeLock
      const ownerPubkey = new PublicKey(wallet.publicKey.toBase58());
      console.log('create debug - final owner param:', ownerPubkey);
      console.log('create debug - final owner instanceof PublicKey:', ownerPubkey instanceof PublicKey);
      console.log('create debug - final unlockTimestamp:', unlockTimestamp);
      console.log('create debug - final amount:', parseFloat(amount) * LAMPORTS_PER_SOL);
      console.log('create debug - final assetType:', AssetType.Sol);

      const result = await client.createSolTimeLock({
        // Normalize owner explicitly to a PublicKey built from base58 string to avoid
        // adapter/object shape issues that can trigger invalid_public_key_input in the
        // library's normalization routine.
        owner: ownerPubkey,
        unlockTimestamp,
        amount: parseFloat(amount) * LAMPORTS_PER_SOL, // Convert to lamports
        assetType: AssetType.Sol
      });
      
      // Store successful result
      const lockData: LockData = {
        owner: wallet.publicKey.toString(),
        amount: parseFloat(amount),
        unlockTime: unlockDateTime.getTime(),
        created: Date.now(),
        lockAddress: result.timeLockAccount.toString()
      };
      localStorage.setItem(`lock_${result.timeLockAccount.toString()}`, JSON.stringify(lockData));
      
      setStatus(`✅ Lock created successfully! Transaction: ${result.signature}`);
      onLockCreated(result.timeLockAccount.toString());
      
    } catch (error: any) {
      console.error('Error creating lock:', error);

      // Handle specific Rust program errors and include logs when available
      let errorMessage = error?.message || String(error) || 'Unknown error occurred';
      try {
        // SendTransactionError may expose getLogs()
        if (typeof error.getLogs === 'function') {
          const logs = await error.getLogs();
          errorMessage += `\nLogs: ${JSON.stringify(logs)}`;
        }
      } catch (logErr) {
        // ignore
      }

      // Map known Anchor error codes if present
      if ((error?.message || '').startsWith('invalid_public_key_input')) {
        const preview = (error.message || '').split(':')[1] || '<unknown>';
        setStatus(`\u274c Error creating lock: Invalid public key input (${preview})`);
        setLoading(false);
        return;
      }

      if (error?.error?.errorCode?.code) {
        switch (error.error.errorCode.code) {
          case 6000:
            errorMessage = 'Withdrawal too early - unlock time not reached';
            break;
          case 6001:
            errorMessage = 'Invalid asset type for this operation';
            break;
          case 6002:
            errorMessage = 'Invalid token vault account';
            break;
          case 6003:
            errorMessage = 'Invalid timestamp - must be in future';
            break;
          case 6004:
            errorMessage = 'Invalid amount - must be greater than zero';
            break;
          default:
            errorMessage = error.error?.errorMessage || error.message || 'Transaction failed';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus(`❌ Error creating lock: ${errorMessage}`);
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
const WithdrawSection: React.FC<{ 
  lockAddress: string; 
  wallet: WalletInfo | null; 
  client: TimeLockClient | null;
  onWithdraw: () => void 
}> = ({ lockAddress, wallet, client, onWithdraw }) => {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const [onChainWithdrawable, setOnChainWithdrawable] = useState<boolean>(false);

  const lockDataStr = lockAddress ? localStorage.getItem(`lock_${lockAddress}`) : null;
  const lockData: LockData | null = lockDataStr ? JSON.parse(lockDataStr) : null;
  const isUnlocked = lockData && now >= lockData.unlockTime;
  const isOwner = lockData && wallet && wallet.publicKey.toString() === lockData.owner;
  const canWithdrawLocal = !!(isUnlocked && isOwner);
  const canWithdraw = canWithdrawLocal && onChainWithdrawable;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll on-chain canWithdraw() every 10s (and whenever client/lockAddress changes)
  useEffect(() => {
    let mounted = true;
    if (!client || !lockAddress) {
      setOnChainWithdrawable(false);
      return;
    }

    const check = async () => {
      try {
        const res = await client.canWithdraw(new PublicKey(lockAddress));
        if (mounted) setOnChainWithdrawable(!!res);
      } catch (err) {
        if (mounted) setOnChainWithdrawable(false);
      }
    };

    check();
    const intv = setInterval(check, 10000);
    return () => { mounted = false; clearInterval(intv); };
  }, [client, lockAddress]);

  const handleWithdraw = async () => {
    if (!canWithdrawLocal || !client) {
      setStatus('Cannot withdraw yet — ensure you are owner and the lock is unlocked.');
      return;
    }

    if (!onChainWithdrawable) {
      setStatus('Waiting for on-chain unlock confirmation. Please try again shortly.');
      return;
    }

    try {
      setLoading(true);
      setStatus('Processing withdrawal with Solana program...');
      
      // Double-check chain time to avoid Anchor InvalidTimestamp-like issues
      try {
        const slot = await client.connectionInstance.getSlot();
        const chainTime = await client.connectionInstance.getBlockTime(slot);
        if (typeof chainTime === 'number' && chainTime * 1000 < (lockData?.unlockTime || 0)) {
          setStatus('⏳ Lock not yet unlocked on-chain (waiting for chain time). Please try again shortly.');
          setLoading(false);
          return;
        }
      } catch (chainErr) {
        // ignore chain time check failures
      }

      // Use real TimeLockClient - normalize owner to PublicKey to avoid invalid key types
      // --- DEBUG: log raw values before withdraw ---
      console.log('withdraw debug - wallet.publicKey raw:', wallet?.publicKey);
      console.log('withdraw debug - wallet.publicKey type:', typeof wallet?.publicKey);
      try {
        console.log('withdraw debug - wallet.publicKey.toBase58():', wallet?.publicKey?.toBase58?.());
      } catch (e) {
        console.warn('withdraw debug - could not toBase58 owner', e);
      }
      console.log('withdraw debug - lockAddress raw:', lockAddress);
      try {
        const previewPk = new PublicKey(lockAddress);
        console.log('withdraw debug - lockAddress.toBase58():', previewPk.toBase58());
      } catch (e) {
        console.error('withdraw debug - invalid lockAddress before withdraw:', lockAddress, e);
        setStatus('Invalid lock address: ' + String(e));
        setLoading(false);
        return;
      }

      // Construct PublicKey for owner and call withdraw
  // Normalize owner as explicit PublicKey (use base58 roundtrip to avoid adapter shapes)
  const ownerKey = new PublicKey(wallet!.publicKey.toBase58());
      console.log('withdraw debug - ownerKey.toBase58():', ownerKey.toBase58());
      const signature = await client.withdrawSol({
        timeLockAccount: new PublicKey(lockAddress),
        owner: ownerKey
      });
      // --- END DEBUG ---
      
      // Remove from localStorage on successful withdrawal
      localStorage.removeItem(`lock_${lockAddress}`);
      
      setStatus(`✅ Withdrawal successful! Transaction: ${signature}`);
      onWithdraw();
      
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      
      // Include logs if available
      let errorMessage = error?.message || 'Unknown error occurred';
      try {
        if (typeof error.getLogs === 'function') {
          const logs = await error.getLogs();
          errorMessage += `\nLogs: ${JSON.stringify(logs)}`;
        }
      } catch (logErr) {
        // ignore
      }

      // Handle specific Rust program errors
      if (error.error?.errorCode?.code) {
        switch (error.error.errorCode.code) {
          case 6000:
            errorMessage = '⏰ Withdrawal too early - unlock time not reached yet';
            break;
          case 6001:
            errorMessage = 'Invalid asset type for this operation';
            break;
          case 6002:
            errorMessage = 'Invalid token vault account';
            break;
          case 6003:
            errorMessage = 'Invalid timestamp';
            break;
          case 6004:
            errorMessage = 'Invalid amount - account has insufficient balance';
            break;
          default:
            errorMessage = error.error?.errorMessage || error.message || 'Transaction failed';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus(`❌ Error withdrawing: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  let buttonText = 'Withdraw Funds';
  if (!wallet) buttonText = 'Connect Wallet';
  else if (!lockData) buttonText = 'No Lock Selected';
  else if (!isOwner) buttonText = 'Not Owner';
  else if (!isUnlocked) buttonText = 'Still Locked';
  else if (!onChainWithdrawable) buttonText = 'Waiting on-chain';

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
  const { wallet, connect, connecting, client } = useWallet();
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
        client={client}
        onLockCreated={handleLockCreated}
      />      <LockInfo 
        lockAddress={currentLockAddress} 
        wallet={wallet} 
      />
      
      <WithdrawSection 
        lockAddress={currentLockAddress} 
        wallet={wallet}
        client={client}
        onWithdraw={handleWithdraw} 
      />
    </div>
  );
}

export default App;
/** @jsxImportSource react */
