import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useLockInfo } from '../hooks/useLockInfo';
import { AssetType } from '../types';

interface LockInfoCardProps {
  lockAddress: string | PublicKey;
  className?: string;
}

export const LockInfoCard: React.FC<LockInfoCardProps> = ({ 
  lockAddress, 
  className = '' 
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const { lockInfo, isLoading, error } = useLockInfo(
    typeof lockAddress === 'string' ? new PublicKey(lockAddress) : lockAddress
  );

  useEffect(() => {
    if (!lockInfo) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const unlockMs = lockInfo.unlockTimestamp.toNumber() * 1000;
      const remaining = unlockMs - now;

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
  }, [lockInfo]);

  if (isLoading) {
    return (
      <div className={`lock-info-card ${className}`}>
        <h3>Lock Information</h3>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`lock-info-card ${className}`}>
        <h3>Lock Information</h3>
        <div className="error" style={{ color: 'red' }}>Error: {error}</div>
      </div>
    );
  }

  if (!lockInfo) {
    return (
      <div className={`lock-info-card ${className}`}>
        <h3>Lock Information</h3>
        <div>No lock data found</div>
      </div>
    );
  }

  const addressStr = typeof lockAddress === 'string' ? lockAddress : lockAddress.toString();
  const isUnlocked = lockInfo.isUnlocked;
  const amountDisplay = lockInfo.assetType === AssetType.Sol 
    ? `${(lockInfo.amount.toNumber() / 1e9).toFixed(4)} SOL`
    : `${lockInfo.amount.toString()} tokens`;

  return (
    <div className={`lock-info-card ${className}`}>
      <h3>Lock Information</h3>
      <div className="info-details">
        <p><strong>Address:</strong> {addressStr.slice(0, 8)}...{addressStr.slice(-8)}</p>
        <p><strong>Owner:</strong> {lockInfo.owner.toString().slice(0, 8)}...{lockInfo.owner.toString().slice(-8)}</p>
        <p><strong>Amount:</strong> {amountDisplay}</p>
        <p><strong>Unlock Time:</strong> {new Date(lockInfo.unlockTimestamp.toNumber() * 1000).toLocaleString()}</p>
        <p><strong>Status:</strong> {isUnlocked ? 'Unlocked ✅' : 'Locked 🔒'}</p>
        <p><strong>Time Remaining:</strong> 
          <span style={{ color: isUnlocked ? '#28a745' : '#007bff' }}>
            {timeRemaining}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LockInfoCard;
