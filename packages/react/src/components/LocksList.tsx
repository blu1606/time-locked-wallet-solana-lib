import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { useUserLocks } from '../hooks/useUserLocks';
import { LockInfoCard } from './LockInfoCard';
import { WithdrawButton } from './WithdrawButton';

interface LocksListProps {
  userAddress: string | PublicKey;
  onLockSelect?: (lockAddress: PublicKey) => void;
  onWithdrawSuccess?: (signature: string, lockAddress: PublicKey) => void;
  className?: string;
}

export const LocksList: React.FC<LocksListProps> = ({ 
  userAddress,
  onLockSelect,
  onWithdrawSuccess,
  className = ''
}) => {
  const userAddressPK = typeof userAddress === 'string' ? new PublicKey(userAddress) : userAddress;
  const { locks, isLoading, error, refetch } = useUserLocks(userAddressPK);

  const handleLockClick = (lockAddress: PublicKey) => {
    if (onLockSelect) {
      onLockSelect(lockAddress);
    }
  };

  const handleWithdrawSuccess = (signature: string, lockAddress: PublicKey) => {
    // Refetch locks after successful withdrawal
    refetch();
    if (onWithdrawSuccess) {
      onWithdrawSuccess(signature, lockAddress);
    }
  };

  if (isLoading) {
    return (
      <div className={`locks-list ${className}`}>
        <h3>Your Time Locks</h3>
        <div>Loading locks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`locks-list ${className}`}>
        <h3>Your Time Locks</h3>
        <div className="error" style={{ color: 'red' }}>Error: {error}</div>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!locks || locks.length === 0) {
    return (
      <div className={`locks-list ${className}`}>
        <h3>Your Time Locks</h3>
        <div>No time locks found. Create your first lock above!</div>
      </div>
    );
  }

  return (
    <div className={`locks-list ${className}`}>
      <h3>Your Time Locks ({locks.length})</h3>
      <div className="locks-grid">
        {locks.map((lock, index) => (
          <div 
            key={lock.toString()}
            className="lock-item"
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              margin: '8px 0',
              cursor: 'pointer'
            }}
            onClick={() => handleLockClick(lock)}
          >
            <LockInfoCard 
              lockAddress={lock}
              className="lock-card"
            />
            <WithdrawButton 
              lockAddress={lock}
              onWithdrawSuccess={(signature) => handleWithdrawSuccess(signature, lock)}
              className="withdraw-section"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocksList;
