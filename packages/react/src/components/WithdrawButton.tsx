import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWithdraw } from '../hooks/useWithdraw';
import { useLockInfo } from '../hooks/useLockInfo';

interface WithdrawButtonProps {
  lockAddress: string | PublicKey;
  onWithdrawSuccess?: (signature: string) => void;
  className?: string;
  disabled?: boolean;
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({ 
  lockAddress, 
  onWithdrawSuccess,
  className = '',
  disabled = false
}) => {
  const lockAddressPK = typeof lockAddress === 'string' ? new PublicKey(lockAddress) : lockAddress;
  const { withdraw, isWithdrawing, error } = useWithdraw();
  const { lockInfo } = useLockInfo(lockAddressPK);

  const handleWithdraw = async () => {
    try {
      const signature = await withdraw({ timeLockAccount: lockAddressPK });
      if (signature && onWithdrawSuccess) {
        onWithdrawSuccess(signature);
      }
    } catch (err) {
      console.error('Withdraw failed:', err);
    }
  };

  const canWithdraw = lockInfo?.isUnlocked && !disabled;
  
  let buttonText = 'Withdraw Funds';
  if (!lockInfo) buttonText = 'No Lock Data';
  else if (!lockInfo.isUnlocked) buttonText = 'Still Locked';
  else if (isWithdrawing) buttonText = 'Processing...';

  return (
    <div className={`withdraw-button-container ${className}`}>
      <button 
        onClick={handleWithdraw}
        disabled={!canWithdraw || isWithdrawing || disabled}
        className="withdraw-button"
      >
        {buttonText}
      </button>
      
      {error && (
        <div className="error" style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default WithdrawButton;
