import React, { useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { useAirdrop } from '../hooks/useAirdrop';

interface AirdropButtonProps {
  connection: Connection;
  address: PublicKey | string | null;
  onSuccess?: (signature: string) => void;
  onError?: (error: string) => void;
  className?: string;
  defaultAmount?: number;
  showAmountInput?: boolean;
  disabled?: boolean;
}

/**
 * Component for requesting SOL airdrops
 */
export const AirdropButton: React.FC<AirdropButtonProps> = ({
  connection,
  address,
  onSuccess,
  onError,
  className = '',
  defaultAmount = 1,
  showAmountInput = true,
  disabled = false,
}) => {
  const [amount, setAmount] = useState(defaultAmount);
  const { requestAirdrop, isRequesting, error, lastSignature, reset } = useAirdrop(connection, address);

  const handleAirdrop = async () => {
    if (!address) return;
    
    const signature = await requestAirdrop(amount);
    
    if (signature) {
      onSuccess?.(signature);
    } else if (error) {
      onError?.(error);
    }
  };

  const handleReset = () => {
    reset();
    setAmount(defaultAmount);
  };

  if (!address) {
    return (
      <div className={`airdrop-button ${className}`}>
        <span className="text-gray-500">No wallet connected</span>
      </div>
    );
  }

  return (
    <div className={`airdrop-component ${className}`}>
      {showAmountInput && (
        <div className="flex items-center gap-2 mb-2">
          <label htmlFor="airdrop-amount" className="text-sm font-medium">
            Amount:
          </label>
          <input
            id="airdrop-amount"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            disabled={isRequesting || disabled}
            className="px-2 py-1 border rounded text-sm w-20"
          />
          <span className="text-sm text-gray-600">SOL</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleAirdrop}
          disabled={isRequesting || disabled || amount <= 0}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequesting ? 'Requesting...' : `Request ${amount} SOL`}
        </button>
        
        {(error || lastSignature) && (
          <button
            onClick={handleReset}
            className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
          >
            Reset
          </button>
        )}
      </div>
      
      {isRequesting && (
        <div className="text-sm text-blue-600 mt-2">
          ⏳ Requesting airdrop... Please wait.
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 mt-2">
          ❌ Error: {error}
        </div>
      )}
      
      {lastSignature && !error && !isRequesting && (
        <div className="text-sm text-green-600 mt-2">
          ✅ Success! Signature: {lastSignature.slice(0, 8)}...
        </div>
      )}
    </div>
  );
};

/**
 * Simple airdrop button without amount input
 */
export const SimpleAirdropButton: React.FC<Omit<AirdropButtonProps, 'showAmountInput'>> = (props) => {
  return <AirdropButton {...props} showAmountInput={false} />;
};

export default AirdropButton;
