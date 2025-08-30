import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast from 'react-hot-toast';

import { useProgramContext } from '../contexts/ProgramContext';
import { AssetType } from '../types';
import { 
  Button, 
  Card, 
  NumberInput, 
  TokenSelector, 
  DateTimePicker, 
  Token 
} from '../components';

// Available tokens (in real app, fetch from token list)
const AVAILABLE_TOKENS: Token[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
];

const CreateLock: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { initialize, depositSol, getTimeLockPDA } = useProgramContext();

  // Form state
  const [selectedToken, setSelectedToken] = useState<Token>(AVAILABLE_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [unlockDateTime, setUnlockDateTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get current datetime in local timezone for min attribute
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleCreateLock = async () => {
    if (!connected || !publicKey) {
      toast.error('Vui lòng kết nối ví trước');
      return;
    }

    if (!amount || !unlockDateTime) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const unlockTimestamp = Math.floor(new Date(unlockDateTime).getTime() / 1000);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (unlockTimestamp <= currentTimestamp) {
      toast.error('Thời gian mở khóa phải ở tương lai');
      return;
    }

    setIsLoading(true);
    
    try {
      const assetType = selectedToken.symbol === 'SOL' ? AssetType.Sol : AssetType.Token;
      
      // Step 1: Initialize time lock account
      toast.loading('Đang khởi tạo time-lock wallet...', { id: 'create-lock' });
      
      const { publicKey: timeLockAccount, signature: initSignature } = await initialize({
        unlockTimestamp,
        assetType,
      });

      toast.loading('Đang gửi tiền vào time-lock wallet...', { id: 'create-lock' });

      // Step 2: Deposit funds
      if (selectedToken.symbol === 'SOL') {
        const amountInLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
        
        const depositSignature = await depositSol({
          amount: amountInLamports,
          timeLockAccount,
        });

        toast.success(
          `Đã tạo time-lock thành công!\n` +
          `Số tiền: ${amount} SOL\n` +
          `Mở khóa: ${new Date(unlockDateTime).toLocaleString('vi-VN')}`,
          { 
            id: 'create-lock',
            duration: 5000 
          }
        );

        console.log('Initialize TX:', initSignature);
        console.log('Deposit TX:', depositSignature);
        console.log('Time Lock Account:', timeLockAccount.toBase58());
      } else {
        // TODO: Handle token deposits
        toast.error('Gửi token chưa được hỗ trợ trong demo này', { id: 'create-lock' });
      }

      // Reset form
      setAmount('');
      setUnlockDateTime('');
      
    } catch (error: any) {
      console.error('Error creating lock:', error);
      toast.error(`Lỗi: ${error.message || 'Không thể tạo time-lock'}`, { id: 'create-lock' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tạo Time-Locked Wallet
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Khóa tiền của bạn với thời gian mở khóa cụ thể
          </p>
        </div>

        {!connected ? (
          <Card className="text-center" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Kết nối ví để bắt đầu
            </h3>
            <WalletMultiButton />
          </Card>
        ) : (
          <Card padding="lg">
            <div className="space-y-6">
              {/* Token Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại tài sản
                </label>
                <TokenSelector
                  tokens={AVAILABLE_TOKENS}
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
                    Xem trước
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Số tiền khóa: <span className="font-medium">{amount} {selectedToken.symbol}</span></p>
                    <p>Thời gian mở khóa: <span className="font-medium">
                      {new Date(unlockDateTime).toLocaleString('vi-VN')}
                    </span></p>
                    <p>Thời gian khóa: <span className="font-medium">
                      {Math.floor((new Date(unlockDateTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày
                    </span></p>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={handleCreateLock}
                loading={isLoading}
                disabled={!amount || !unlockDateTime}
                fullWidth
                size="lg"
                variant="primary"
              >
                Tạo Time-Lock Wallet
              </Button>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Lưu ý quan trọng
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Sau khi tạo, bạn không thể rút tiền cho đến khi hết thời gian khóa</li>
                  <li>• Chỉ có bạn mới có thể rút tiền từ wallet này</li>
                  <li>• Giao dịch sẽ được thực hiện trên Solana devnet</li>
                  <li>• Lưu lại địa chỉ time-lock account để theo dõi</li>
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
