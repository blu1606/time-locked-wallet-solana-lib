import { useState, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { validateAndNormalizePublicKey } from '../utils/validation';

export interface UseAirdropReturn {
  requestAirdrop: (amount?: number) => Promise<string | null>;
  isRequesting: boolean;
  error: string | null;
  lastSignature: string | null;
  reset: () => void;
}

/**
 * Hook for requesting SOL airdrops (devnet/testnet only)
 */
export const useAirdrop = (
  connection: Connection | null,
  address: PublicKey | string | null
): UseAirdropReturn => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const requestAirdrop = useCallback(async (amount: number = 1): Promise<string | null> => {
    if (!connection || !address) {
      setError('Connection or address not available');
      return null;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const pubkey = validateAndNormalizePublicKey(address);
      const amountLamports = amount * LAMPORTS_PER_SOL;
      
      console.log(`🎯 Requesting ${amount} SOL airdrop for ${pubkey.toString()}`);
      
      // Request airdrop
      const signature = await connection.requestAirdrop(pubkey, amountLamports);
      console.log('📤 Airdrop signature:', signature);
      
      setLastSignature(signature);
      
      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      console.log('⏳ Waiting for confirmation...');
      
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash
      }, 'confirmed');
      
      console.log('✅ Airdrop confirmed!');
      
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Airdrop failed';
      setError(errorMessage);
      console.error('❌ Airdrop failed:', err);
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, [connection, address]);

  const reset = useCallback(() => {
    setIsRequesting(false);
    setError(null);
    setLastSignature(null);
  }, []);

  return {
    requestAirdrop,
    isRequesting,
    error,
    lastSignature,
    reset,
  };
};
