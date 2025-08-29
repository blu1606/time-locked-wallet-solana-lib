import { useState, useCallback } from 'react';
import { WithdrawParams } from '../types';
import { useTimeLockContext } from '../provider';

export interface UseWithdrawReturn {
  withdraw: (params: WithdrawParams) => Promise<string | null>;
  isWithdrawing: boolean;
  error: string | null;
  withdrawTxSignature: string | null;
  reset: () => void;
}

export const useWithdraw = (): UseWithdrawReturn => {
  const { client } = useTimeLockContext();
  
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawTxSignature, setWithdrawTxSignature] = useState<string | null>(null);

  const withdraw = useCallback(async (params: WithdrawParams): Promise<string | null> => {
    if (!client) {
      setError('Client not available');
      return null;
    }

    setIsWithdrawing(true);
    setError(null);
    
    try {
      const txSignature = await client.withdraw(params);
      setWithdrawTxSignature(txSignature);
      return txSignature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw assets';
      setError(errorMessage);
      return null;
    } finally {
      setIsWithdrawing(false);
    }
  }, [client]);

  const reset = useCallback(() => {
    setIsWithdrawing(false);
    setError(null);
    setWithdrawTxSignature(null);
  }, []);

  return {
    withdraw,
    isWithdrawing,
    error,
    withdrawTxSignature,
    reset
  };
};
