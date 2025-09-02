import React, { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useLockCreation } from '../hooks/useLockCreation';
import { useTimeLockContext } from '../provider';
import { AssetType } from '../types';
import { classNames } from '../utils/classNames';
import NumberInput from './NumberInput';
import TokenSelector, { Token } from './TokenSelector';
import DateTimePicker from './DateTimePicker';
import Button from './Button';

interface LockCreationFormProps {
  onLockCreated?: (address: string) => void;
  className?: string;
  walletAddress?: string;
  tokens?: Token[];
}

// Default tokens
const DEFAULT_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
];

export const LockCreationForm: React.FC<LockCreationFormProps> = ({ 
  onLockCreated,
  className = '',
  walletAddress,
  tokens = DEFAULT_TOKENS
}) => {
  const { connection } = useTimeLockContext();
  const { createLock, isCreating, error, createdLockAddress, reset } = useLockCreation();
  
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);
  const [amount, setAmount] = useState('0.1');
  const [unlockDateTime, setUnlockDateTime] = useState('');

  useEffect(() => {
    // Set default values: current time + 5 minutes
    const setDefaults = async () => {
      try {
        const slot = await connection.getSlot();
        const chainTime = await connection.getBlockTime(slot);
        let baseMs = Date.now();
        if (typeof chainTime === 'number') baseMs = chainTime * 1000;

        const unlockMs = baseMs + 5 * 60 * 1000; // 5 minutes later
        const d = new Date(unlockMs);
        setUnlockDateTime(d.toISOString().slice(0, 16));
        return;
      } catch (err) {
        // Fallback to local time
      }

      const fiveMinLater = new Date(Date.now() + 5 * 60 * 1000);
      setUnlockDateTime(fiveMinLater.toISOString().slice(0, 16));
    };

    setDefaults();
  }, [connection]);

  useEffect(() => {
    if (createdLockAddress && onLockCreated) {
      onLockCreated(createdLockAddress.toString());
    }
  }, [createdLockAddress, onLockCreated]);

  // Get current datetime in local timezone for min attribute
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!amount || !unlockDateTime) {
      alert('Please fill all fields');
      return;
    }
    
    const unlockDate = new Date(unlockDateTime);
    if (unlockDate <= new Date()) {
      alert('Unlock time must be in the future');
      return;
    }

    const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
    const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

    await createLock({
      owner: new PublicKey(walletAddress),
      unlockTimestamp,
      assetType: selectedToken.symbol === 'SOL' ? AssetType.Sol : AssetType.Token,
      amount: amountInLamports
    });
  };

  return (
    <div className={classNames('space-y-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại tài sản
          </label>
          <TokenSelector
            tokens={tokens}
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
          />
        </div>

        {/* Amount Input */}
        <NumberInput
          label="Số lượng"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          suffix={selectedToken.symbol}
          decimals={selectedToken.decimals}
          placeholder="0.00"
        />

        {/* Unlock Time */}
        <DateTimePicker
          label="Thời gian mở khóa"
          value={unlockDateTime}
          onChange={setUnlockDateTime}
          min={localDateTime}
        />

        {/* Preview */}
        {amount && unlockDateTime && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              📋 Xem trước
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Số tiền khóa: <span className="font-medium text-gray-900 dark:text-white">{amount} {selectedToken.symbol}</span></p>
              <p>Thời gian mở khóa: <span className="font-medium text-gray-900 dark:text-white">
                {new Date(unlockDateTime).toLocaleString('vi-VN')}
              </span></p>
              <p>Thời gian khóa: <span className="font-medium text-gray-900 dark:text-white">
                {Math.floor((new Date(unlockDateTime).getTime() - Date.now()) / (1000 * 60))} phút
              </span></p>
            </div>
          </div>
        )}
        
        <Button
          type="submit"
          loading={isCreating}
          disabled={!amount || !unlockDateTime}
          fullWidth
          size="lg"
          variant="primary"
        >
          🔒 Tạo Time-Lock Wallet
        </Button>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ❌ Lỗi: {error}
            </p>
          </div>
        )}
        
        {createdLockAddress && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✅ Tạo lock thành công!
            </p>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
              Address: {createdLockAddress.toString().slice(0, 8)}...{createdLockAddress.toString().slice(-8)}
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LockCreationForm;
