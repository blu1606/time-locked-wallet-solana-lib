import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { 
  Button, 
  Card, 
  Countdown,
  Modal
} from '@time-locked-wallet/react';
import { TimeLockClient } from '@time-locked-wallet/core';

interface LockInfo {
  address: string;
  amount: number;
  unlockTime: number;
  created: number;
  isUnlocked: boolean;
}

interface DashboardPageProps {
  wallet: { publicKey: PublicKey };
  client: TimeLockClient | null;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ wallet, client }) => {
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLock, setSelectedLock] = useState<LockInfo | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load locks from localStorage (in real app, fetch from blockchain)
  useEffect(() => {
    const loadLocks = () => {
      const allLocks: LockInfo[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lock_')) {
          try {
            const lockData = JSON.parse(localStorage.getItem(key) || '{}');
            if (lockData.owner === wallet.publicKey.toString()) {
              allLocks.push({
                address: key.replace('lock_', ''),
                amount: lockData.amount || 0,
                unlockTime: lockData.unlockTime || 0,
                created: lockData.created || 0,
                isUnlocked: Date.now() >= (lockData.unlockTime || 0),
              });
            }
          } catch (error) {
            console.error('Error parsing lock data:', error);
          }
        }
      }
      
      // Sort by creation time (newest first)
      allLocks.sort((a, b) => b.created - a.created);
      setLocks(allLocks);
      setIsLoading(false);
    };

    loadLocks();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadLocks, 5000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  const handleWithdraw = async (lock: LockInfo) => {
    if (!client) {
      toast.error('Client chưa được khởi tạo');
      return;
    }

    if (!lock.isUnlocked) {
      toast.error('Chưa đến thời gian mở khóa');
      return;
    }

    setIsWithdrawing(true);
    
    try {
      toast.loading('Đang rút tiền...', { id: 'withdraw' });
      
      const signature = await client.withdrawSol({
        timeLockAccount: new PublicKey(lock.address),
        owner: wallet.publicKey
      });

      // Remove from localStorage
      localStorage.removeItem(`lock_${lock.address}`);
      
      // Update local state
      setLocks(prev => prev.filter(l => l.address !== lock.address));
      setSelectedLock(null);
      
      toast.success(
        `✅ Rút tiền thành công!\nSố tiền: ${lock.amount} SOL\nTransaction: ${signature}`,
        { id: 'withdraw', duration: 5000 }
      );
      
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast.error(`❌ Lỗi: ${error.message || 'Không thể rút tiền'}`, { id: 'withdraw' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const getStatusBadge = (lock: LockInfo) => {
    if (lock.isUnlocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          ✅ Có thể rút
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        🔒 Đang khóa
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Quản lý các time-locked wallet của bạn
          </p>
        </div>

        {locks.length === 0 ? (
          <Card className="text-center" padding="lg">
            <div className="py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có time-lock nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hãy tạo time-locked wallet đầu tiên của bạn
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {locks.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng số lock
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {locks.filter(l => l.isUnlocked).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Có thể rút
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {locks.filter(l => !l.isUnlocked).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Đang khóa
                  </div>
                </div>
              </Card>
            </div>

            {/* Locks List */}
            <div className="grid gap-4">
              {locks.map((lock) => (
                <Card key={lock.address} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {lock.amount} SOL
                        </h3>
                        {getStatusBadge(lock)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <p><strong>Địa chỉ:</strong> {lock.address.slice(0, 8)}...{lock.address.slice(-8)}</p>
                          <p><strong>Tạo lúc:</strong> {formatDate(lock.created)}</p>
                        </div>
                        <div>
                          <p><strong>Mở khóa:</strong> {formatDate(lock.unlockTime)}</p>
                          <div className="mt-2">
                            {lock.isUnlocked ? (
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                ✅ Đã có thể rút tiền
                              </div>
                            ) : (
                              <Countdown
                                targetDate={new Date(lock.unlockTime)}
                                compact
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        onClick={() => setSelectedLock(lock)}
                        variant={lock.isUnlocked ? 'primary' : 'secondary'}
                        disabled={!lock.isUnlocked}
                      >
                        {lock.isUnlocked ? 'Rút tiền' : 'Chi tiết'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        <Modal
          isOpen={!!selectedLock}
          onClose={() => setSelectedLock(null)}
          title="Chi tiết Time-Lock"
          size="md"
        >
          {selectedLock && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Thông tin chi tiết
                </h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Số tiền:</strong> {selectedLock.amount} SOL</p>
                  <p><strong>Địa chỉ:</strong> {selectedLock.address}</p>
                  <p><strong>Tạo lúc:</strong> {formatDate(selectedLock.created)}</p>
                  <p><strong>Mở khóa:</strong> {formatDate(selectedLock.unlockTime)}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedLock)}</p>
                </div>
              </div>
              
              {!selectedLock.isUnlocked && (
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    ⏰ Thời gian còn lại
                  </h4>
                  <Countdown
                    targetDate={new Date(selectedLock.unlockTime)}
                    onExpired={() => {
                      setLocks(prev => prev.map(l => 
                        l.address === selectedLock.address 
                          ? { ...l, isUnlocked: true }
                          : l
                      ));
                    }}
                  />
                </div>
              )}
              
              {selectedLock.isUnlocked && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-green-600 dark:text-green-400 font-medium mb-2">
                      ✅ Sẵn sàng rút tiền
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Bạn có thể rút {selectedLock.amount} SOL ngay bây giờ
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handleWithdraw(selectedLock)}
                    loading={isWithdrawing}
                    fullWidth
                    variant="primary"
                    size="lg"
                  >
                    💰 Rút {selectedLock.amount} SOL
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default DashboardPage;
