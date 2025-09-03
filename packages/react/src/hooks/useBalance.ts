import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { validateAndNormalizePublicKey } from '../utils/validation';

export interface UseBalanceOptions {
  refreshInterval?: number; // milliseconds
  autoRefresh?: boolean;
}

export interface UseBalanceReturn {
  balance: number | null;
  balanceFormatted: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  accountExists: boolean;
}

/**
 * Account utilities class for React hooks
 */
class AccountUtils {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getBalance(address: PublicKey | string): Promise<number> {
    try {
      const pubkey = validateAndNormalizePublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async accountExists(address: PublicKey | string): Promise<boolean> {
    try {
      const pubkey = validateAndNormalizePublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance > 0;
    } catch {
      return false;
    }
  }

  static formatBalance(balance: number): string {
    return Math.round(balance * 100000) / 100000 + ' SOL';
  }
}

/**
 * Hook to get and manage account balance
 */
export const useBalance = (
  connection: Connection | null,
  address: PublicKey | string | null,
  options: UseBalanceOptions = {}
): UseBalanceReturn => {
  const { refreshInterval = 10000, autoRefresh = true } = options;
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);

  const refresh = useCallback(async () => {
    if (!connection || !address) {
      setBalance(null);
      setAccountExists(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountUtils = new AccountUtils(connection);
      const balanceValue = await accountUtils.getBalance(address);
      const exists = await accountUtils.accountExists(address);
      
      setBalance(balanceValue);
      setAccountExists(exists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connection, address]);

  // Auto refresh
  useEffect(() => {
    refresh();
    
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefresh, refreshInterval]);

  const balanceFormatted = balance !== null ? AccountUtils.formatBalance(balance) : '-- SOL';

  return {
    balance,
    balanceFormatted,
    isLoading,
    error,
    refresh,
    accountExists,
  };
};
