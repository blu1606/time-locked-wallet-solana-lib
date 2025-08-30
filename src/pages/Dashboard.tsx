import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';

import { useProgramContext } from '../contexts/ProgramContext';
import { TimeLockData, AssetType } from '../types';
import { Button, Card, Countdown } from '../components';
import { ClockIcon, CurrencyDollarIcon, KeyIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { getUserTimeLocks, withdrawSol } = useProgramContext();

  const [timeLocks, setTimeLocks] = useState<TimeLockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);

  // Load user's time locks
  const loadTimeLocks = async () => {
    if (!connected || !publicKey) return;

    setIsLoading(true);
    try {
      const locks = await getUserTimeLocks(publicKey);
      setTimeLocks(locks);
    } catch (error) {
      console.error('Error loading time locks:', error);
      toast.error('Không thể tải danh sách time-lock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeLocks();
  }, [connected, publicKey]);

  // Handle withdraw
  const handleWithdraw = async (timeLock: TimeLockData) => {
    if (!connected || !publicKey) {
      toast.error('Vui lòng kết nối ví');
      return;
    }

    if (!timeLock.walletInfo?.isUnlocked) {
      toast.error('Chưa đến thời gian mở khóa');
      return;
    }

    setIsWithdrawing(timeLock.publicKey.toBase58());
    
    try {
      toast.loading('Đang rút tiền...', { id: 'withdraw' });

      if (timeLock.account.assetType === AssetType.Sol) {
        const signature = await withdrawSol(timeLock.publicKey);
        
        toast.success(
          `Đã rút thành công ${(timeLock.account.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL!`,
          { id: 'withdraw', duration: 5000 }
        );

        console.log('Withdraw TX:', signature);
        
        // Reload time locks
        setTimeout(loadTimeLocks, 2000);
      } else {
        toast.error('Rút token chưa được hỗ trợ trong demo này', { id: 'withdraw' });
      }
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast.error(`Lỗi rút tiền: ${error.message || 'Unknown error'}`, { id: 'withdraw' });
    } finally {
      setIsWithdrawing(null);
    }
  };

  // Format amount based on asset type
  const formatAmount = (amount: BN, assetType: AssetType) => {
    if (assetType === AssetType.Sol) {
      return `${(amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
    }
    return `${amount.toString()} Tokens`;
  };

  // Calculate status
  const getStatus = (walletInfo?: any) => {
    if (!walletInfo) return { text: 'Đang tải...', color: 'gray' };
    
    if (walletInfo.isUnlocked) {
      return { text: 'Có thể rút', color: 'green' };
    } else {
      return { text: 'Đang khóa', color: 'yellow' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quản lý các time-locked wallet của bạn
          </p>
        </div>

        {!connected ? (
          <Card className="text-center" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Kết nối ví để xem dashboard
            </h3>
            <WalletMultiButton />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <KeyIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Tổng số ví
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {timeLocks.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Đang khóa
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {timeLocks.filter(t => !t.walletInfo?.isUnlocked).length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Có thể rút
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {timeLocks.filter(t => t.walletInfo?.isUnlocked).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Danh sách Time-Lock Wallets
              </h2>
              <Button
                variant="secondary"
                onClick={loadTimeLocks}
                loading={isLoading}
              >
                Tải lại
              </Button>
            </div>

            {/* Time Locks List */}
            {isLoading ? (
              <Card className="text-center" padding="lg">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
              </Card>
            ) : timeLocks.length === 0 ? (
              <Card className="text-center" padding="lg">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bạn chưa có time-lock wallet nào
                </p>
                <Button variant="primary" onClick={() => window.location.href = '/'}>
                  Tạo Time-Lock đầu tiên
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {timeLocks.map((timeLock) => {
                  const status = getStatus(timeLock.walletInfo);
                  const unlockDate = new Date(timeLock.account.unlockTimestamp.toNumber() * 1000);
                  
                  return (
                    <Card key={timeLock.publicKey.toBase58()} hover>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {formatAmount(timeLock.account.amount, timeLock.account.assetType)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {timeLock.publicKey.toBase58().slice(0, 8)}...{timeLock.publicKey.toBase58().slice(-8)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              status.color === 'green'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : status.color === 'yellow'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {status.text}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Loại tài sản:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {timeLock.account.assetType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Mở khóa lúc:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {unlockDate.toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* Countdown or Status */}
                        {timeLock.walletInfo?.isUnlocked ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-green-800 dark:text-green-200 text-sm font-medium text-center">
                              ✅ Đã có thể rút tiền
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-yellow-800 dark:text-yellow-200 text-xs mb-2 text-center">
                              Thời gian còn lại:
                            </p>
                            <Countdown
                              targetDate={unlockDate}
                              compact
                              className="justify-center"
                            />
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          fullWidth
                          variant={timeLock.walletInfo?.isUnlocked ? 'primary' : 'ghost'}
                          disabled={!timeLock.walletInfo?.isUnlocked}
                          loading={isWithdrawing === timeLock.publicKey.toBase58()}
                          onClick={() => handleWithdraw(timeLock)}
                        >
                          {timeLock.walletInfo?.isUnlocked ? 'Rút tiền' : 'Chưa thể rút'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
