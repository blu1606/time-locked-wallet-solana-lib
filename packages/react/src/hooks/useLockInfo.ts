import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { WalletInfo } from '../types';
import { useTimeLockContext } from '../provider';

export interface UseLockInfoReturn {
  lockInfo: WalletInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshLockInfo: () => Promise<void>;
}

export const useLockInfo = (lockAddress: PublicKey | null): UseLockInfoReturn => {
  const { client } = useTimeLockContext();
  
  const [lockInfo, setLockInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLockInfo = useCallback(async () => {
    if (!lockAddress || !client) {
      setLockInfo(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const info = await client.getWalletInfo(lockAddress);
      setLockInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lock info';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [lockAddress, client]);

  const refreshLockInfo = useCallback(async () => {
    await fetchLockInfo();
  }, [fetchLockInfo]);

  useEffect(() => {
    fetchLockInfo();
  }, [fetchLockInfo]);

  return {
    lockInfo,
    isLoading,
    error,
    refreshLockInfo
  };
};
