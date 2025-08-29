import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { CreateTimeLockParams } from '../types';
import { useTimeLockContext } from '../provider';

export interface UseLockCreationReturn {
  createLock: (params: CreateTimeLockParams) => Promise<PublicKey | null>;
  isCreating: boolean;
  error: string | null;
  createdLockAddress: PublicKey | null;
  reset: () => void;
}

export const useLockCreation = (): UseLockCreationReturn => {
  const { client } = useTimeLockContext();
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLockAddress, setCreatedLockAddress] = useState<PublicKey | null>(null);

  const createLock = useCallback(async (params: CreateTimeLockParams): Promise<PublicKey | null> => {
    if (!client) {
      setError('Client not available');
      return null;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      const address = await client.createTimeLock(params);
      setCreatedLockAddress(address);
      return address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lock';
      setError(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [client]);

  const reset = useCallback(() => {
    setIsCreating(false);
    setError(null);
    setCreatedLockAddress(null);
  }, []);

  return {
    createLock,
    isCreating,
    error,
    createdLockAddress,
    reset
  };
};
