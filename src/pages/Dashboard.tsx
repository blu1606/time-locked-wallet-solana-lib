import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

import { useTimeLock } from '../hooks/useTimeLock';
import { TokenService } from '../services/tokenService';
import { TimeLockData, AssetType } from '../types';
import { Button, Card, Countdown } from '../components';
import { ClockIcon, CurrencyDollarIcon, KeyIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  onNavigateToCreate?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToCreate }) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { loadUserTimeLocks, withdrawFromTimeLock, isLoading, isWithdrawing } = useTimeLock();

  const [timeLocks, setTimeLocks] = useState<TimeLockData[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [completedPayments, setCompletedPayments] = useState<TimeLockData[]>([]);
  const [activeTab, setActiveTab] = useState<'locked' | 'ready' | 'completed'>('locked');

  // Load user's time locks
  const loadTimeLocks = useCallback(async () => {
    const locks = await loadUserTimeLocks();
    setTimeLocks(locks);
  }, [loadUserTimeLocks]);

  // Load wallet balance (SOL and USDC)
  const loadWalletBalance = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      console.log('💰 Loading wallet balances...');
      console.log('🔍 Using USDC mint:', TokenService.USDC_DEVNET_MINT);
      
      // Load SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solBalanceFormatted = solBalance / LAMPORTS_PER_SOL;
      console.log('SOL Balance:', solBalanceFormatted);
      setWalletBalance(solBalanceFormatted);

      // Load USDC balance with detailed debugging
      try {
        const usdcMint = new PublicKey(TokenService.USDC_DEVNET_MINT);
        const usdcTokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
        
        console.log('🔍 USDC Debug Info:', {
          usdcMint: usdcMint.toBase58(),
          expectedTokenAccount: usdcTokenAccount.toBase58(),
          wallet: publicKey.toBase58()
        });

        // Check if token account exists
        const accountInfo = await connection.getAccountInfo(usdcTokenAccount);
        if (!accountInfo) {
          console.log('❌ USDC token account does not exist');
          
          // Try to find any USDC token accounts for this wallet
          const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
            mint: usdcMint
          });
          
          console.log('🔍 Found USDC token accounts:', tokenAccounts.value.length);
          
          if (tokenAccounts.value.length > 0) {
            // Use the first USDC token account found
            const tokenAccountPubkey = tokenAccounts.value[0].pubkey;
            console.log('✅ Using existing USDC account:', tokenAccountPubkey.toBase58());
            
            const balance = await connection.getTokenAccountBalance(tokenAccountPubkey);
            const usdcBalanceFormatted = parseFloat(balance.value.uiAmountString || '0');
            console.log('💰 USDC Balance:', usdcBalanceFormatted);
            setUsdcBalance(usdcBalanceFormatted);
          } else {
            console.log('❌ No USDC token accounts found');
            setUsdcBalance(0);
          }
        } else {
          // Account exists, get balance
          const usdcTokenAccountInfo = await connection.getTokenAccountBalance(usdcTokenAccount);
          const usdcBalanceFormatted = parseFloat(usdcTokenAccountInfo.value.uiAmountString || '0');
          console.log('💰 USDC Balance (ATA):', usdcBalanceFormatted);
          setUsdcBalance(usdcBalanceFormatted);
        }
      } catch (usdcError) {
        console.error('❌ USDC balance error:', usdcError);
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    loadTimeLocks();
    loadWalletBalance();
  }, [connected, publicKey, loadTimeLocks, loadWalletBalance]);

  // Auto-refresh data every 5 seconds for real-time updates
  useEffect(() => {
    if (!connected || !publicKey) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      loadTimeLocks();
      loadWalletBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, publicKey, loadTimeLocks, loadWalletBalance]);

  // Handle withdraw
  const handleWithdraw = async (timeLock: TimeLockData) => {
    const result = await withdrawFromTimeLock(timeLock);
    
    if (result.success) {
      // Move to completed payments
      setCompletedPayments(prev => [...prev, timeLock]);
      
      // Reload time locks after successful withdrawal
      setTimeout(loadTimeLocks, 2000);
    }
  };

  // Handle delete payment (refund)
  const handleDeletePayment = async (timeLock: TimeLockData) => {
    if (!window.confirm('Are you sure you want to delete this payment and refund the amount?')) {
      return;
    }
    
    // For now, just show a message since we don't have delete functionality in the smart contract
    window.alert('Delete functionality requires smart contract modification. This feature is not available yet.');
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
    if (!walletInfo) return { text: 'Loading...', color: 'gray' };
    
    if (walletInfo.isUnlocked) {
      return { text: 'Ready to withdraw', color: 'green' };
    } else {
      return { text: 'Locked', color: 'yellow' };
    }
  };

  // Get all payments (where current user is the owner)
  const getAllPayments = () => {
    if (!publicKey) return [];
    
    return timeLocks.filter(lock => {
      return lock.account.owner.equals(publicKey);
    });
  };

  // Get locked payments (not yet unlocked)
  const getLockedPayments = () => {
    return getAllPayments().filter(lock => {
      return !lock.walletInfo?.isUnlocked;
    }).sort((a, b) => {
      // Sort by unlock time (earliest first)
      return a.account.unlockTimestamp.toNumber() - b.account.unlockTimestamp.toNumber();
    });
  };

  // Get ready to withdraw payments (unlocked but not withdrawn)
  const getReadyToWithdrawPayments = () => {
    return getAllPayments().filter(lock => {
      return lock.walletInfo?.isUnlocked;
    });
  };

  // Get completed payments (withdrawn)
  const getCompletedPayments = () => {
    return completedPayments;
  };

  // Render payment card
  const renderPaymentCard = (timeLock: TimeLockData, showActions: boolean = true) => {
    const status = getStatus(timeLock.walletInfo);
    const unlockDate = new Date(timeLock.account.unlockTimestamp.toNumber() * 1000);
    
    return (
      <Card key={timeLock.publicKey.toBase58()} hover>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {formatAmount(timeLock.account.amount, timeLock.account.assetType)}
              </h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900/20 dark:text-${status.color}-200`}>
                {status.text}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Asset Type:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {timeLock.account.assetType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Unlock Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {unlockDate.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time-Lock ID:</span>
              <span className="font-medium text-gray-900 dark:text-white text-xs">
                {timeLock.publicKey.toBase58().slice(0, 8)}...{timeLock.publicKey.toBase58().slice(-8)}
              </span>
            </div>
          </div>

          {/* Countdown or Status */}
          {timeLock.walletInfo?.isUnlocked ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-800 dark:text-green-200 text-sm font-medium text-center">
                ✅ Ready to withdraw
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-yellow-800 dark:text-yellow-200 text-xs mb-2 text-center">
                Time remaining:
              </p>
              <div className="flex justify-center">
                <Countdown
                  targetDate={unlockDate}
                  compact
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              {timeLock.walletInfo?.isUnlocked ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleWithdraw(timeLock)}
                  disabled={isWithdrawing === timeLock.publicKey.toBase58()}
                  className="flex-1"
                >
                  {isWithdrawing === timeLock.publicKey.toBase58() ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDeletePayment(timeLock)}
                  className="flex-1"
                >
                  Delete & Refund
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your sent time-locked payments
          </p>
        </div>

        {!connected ? (
          <Card className="text-center" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Connect wallet to view dashboard
            </h3>
            <WalletMultiButton />
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Wallet Balance
                    </p>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {walletBalance.toFixed(4)} SOL
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {usdcBalance.toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <KeyIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Locks
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {getAllPayments().length}
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
                      Locked
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {getLockedPayments().length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Unlocked
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {getReadyToWithdrawPayments().length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>



            {/* Title */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Time-Locked Wallets
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Auto-refreshing every 5 seconds
              </p>
            </div>

            {/* Time Locks List */}
            {isLoading ? (
              <Card className="text-center" padding="lg">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </Card>
            ) : getAllPayments().length === 0 ? (
              <Card className="text-center" padding="lg">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't created any time-locked wallets yet
                </p>
                <Button variant="primary" onClick={() => onNavigateToCreate?.()}>
                  Create First Lock
                </Button>
              </Card>
            ) : (
              <div>
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('locked')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'locked'
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Locked ({getLockedPayments().length})
                    </button>
                    <button
                      onClick={() => setActiveTab('ready')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'ready'
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Ready ({getReadyToWithdrawPayments().length})
                    </button>
                    <button
                      onClick={() => setActiveTab('completed')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'completed'
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Completed ({getCompletedPayments().length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'locked' && (
                    <div>
                      {getLockedPayments().length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {getLockedPayments().map((timeLock) => renderPaymentCard(timeLock))}
                        </div>
                      ) : (
                        <Card className="text-center" padding="lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            No locked wallets found
                          </p>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeTab === 'ready' && (
                    <div>
                      {getReadyToWithdrawPayments().length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {getReadyToWithdrawPayments().map((timeLock) => renderPaymentCard(timeLock))}
                        </div>
                      ) : (
                        <Card className="text-center" padding="lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            No wallets ready to withdraw
                          </p>
                        </Card>
                      )}
                    </div>
                  )}

                  {activeTab === 'completed' && (
                    <div>
                      {getCompletedPayments().length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {getCompletedPayments().map((timeLock) => renderPaymentCard(timeLock, false))}
                        </div>
                      ) : (
                        <Card className="text-center" padding="lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            No completed transactions yet
                          </p>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
