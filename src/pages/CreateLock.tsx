import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';

import { TokenService } from '../services/tokenService';
import { LockTypeService } from '../services/lockTypeService';
import { useTimeLock } from '../hooks/useTimeLock';
import { 
  Button, 
  Card, 
  NumberInput, 
  TokenSelector, 
  LockTypeSelector,
  DateTimePicker, 
  Token 
} from '../components';
import { LockType } from '../components/LockTypeSelector';

interface CreateLockProps {
  onNavigateToDashboard?: () => void;
}

const CreateLock: React.FC<CreateLockProps> = ({ onNavigateToDashboard }) => {
  const { connected } = useWallet();
  const { createTimeLock, isLoading } = useTimeLock();

  // Form state
  const [selectedToken, setSelectedToken] = useState<Token>(TokenService.getSolToken());
  const availableTokens = TokenService.getDefaultTokens();
  const [selectedLockType, setSelectedLockType] = useState<LockType>(LockTypeService.getSelfLockType());
  const availableLockTypes = LockTypeService.getDefaultLockTypes();
  const [amount, setAmount] = useState('');
  const [unlockDateTime, setUnlockDateTime] = useState(() => {
    // Set default to current time
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    return localDateTime;
  });
  const [recipientAddress, setRecipientAddress] = useState('');

  // Get current datetime in local timezone for min attribute and default value
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleCreateLock = async () => {
    if (!connected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!amount || !unlockDateTime) {
      toast.error('Please fill in all fields');
      return;
    }

    // For send-to-others, validate recipient address
    if (selectedLockType.id === 'send-to-others') {
      if (!recipientAddress.trim()) {
        toast.error('Please enter recipient address');
        return;
      }

      try {
        new PublicKey(recipientAddress);
      } catch (error) {
        toast.error('Invalid recipient address');
        return;
      }
    }

    const result = await createTimeLock(amount, unlockDateTime, selectedToken, selectedLockType.id === 'send-to-others' ? recipientAddress : undefined);
    
    if (result.success) {
      // Reset form on success
      setAmount('');
      setUnlockDateTime('');
      setRecipientAddress('');
      
      // Navigate to dashboard to see the new payment
      if (onNavigateToDashboard) {
        onNavigateToDashboard();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Time-Locked Wallet
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Lock your tokens with a specific unlock time
          </p>
        </div>

        {!connected ? (
          <Card className="text-center" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Connect wallet to get started
            </h3>
            <WalletMultiButton />
          </Card>
        ) : (
          <Card padding="lg">
            <div className="space-y-6">
              {/* Lock Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lock Type
                </label>
                <LockTypeSelector
                  lockTypes={availableLockTypes}
                  selectedLockType={selectedLockType}
                  onLockTypeSelect={setSelectedLockType}
                />
              </div>

              {/* Recipient Address - Only show for send-to-others */}
              {selectedLockType.id === 'send-to-others' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter recipient's Solana address"
                    disabled
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm transition-colors duration-200 sm:text-sm py-3 px-4 cursor-not-allowed"
                  />
                </div>
              )}

              {/* Token Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset Type
                </label>
                <TokenSelector
                  tokens={availableTokens}
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                />
              </div>

              {/* Amount Input */}
              <NumberInput
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                suffix={selectedToken.symbol}
                decimals={selectedToken.decimals}
                placeholder="0.00"
              />

              {/* Unlock Time */}
              <DateTimePicker
                label="Unlock Time"
                value={unlockDateTime}
                onChange={setUnlockDateTime}
                min={localDateTime}
              />

              {/* Preview */}
              {amount && unlockDateTime && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Preview
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Lock Type: <span className="font-medium">
                      {selectedLockType.name}
                    </span></p>
                    {selectedLockType.id === 'send-to-others' && recipientAddress && (
                      <p>Recipient: <span className="font-medium">{recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}</span></p>
                    )}
                    <p>Amount: <span className="font-medium">{amount} {selectedToken.symbol}</span></p>
                    <p>Unlock Time: <span className="font-medium">
                      {unlockDateTime.replace('T', ' ')} (Vietnam Time)
                    </span></p>
                    <p>Lock Duration: <span className="font-medium">
                      {Math.floor((new Date(unlockDateTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </span></p>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={handleCreateLock}
                loading={isLoading}
                disabled={!amount || !unlockDateTime || (selectedLockType.id === 'send-to-others' && !recipientAddress)}
                fullWidth
                size="lg"
                variant="primary"
              >
                Create Time-Locked Wallet
              </Button>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Important Notes
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Tokens will be locked until the specified unlock time</li>
                  <li>• Only you can withdraw from this time-lock when unlocked</li>
                  <li>• Transaction will be executed on Solana devnet</li>
                  <li>• Save the time-lock account address for tracking</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateLock;
