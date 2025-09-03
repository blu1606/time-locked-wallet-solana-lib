import { PublicKey } from '@solana/web3.js';

/**
 * Validates and normalizes a public key from various input formats
 */
export function validateAndNormalizePublicKey(key: string | PublicKey | null | undefined): PublicKey {
  if (!key) {
    throw new Error('Public key is required');
  }
  
  try {
    if (key instanceof PublicKey) {
      key.toBase58();
      return key;
    }
    
    if (typeof key === 'string') {
      return new PublicKey(key);
    }
    
    if (key && typeof key === 'object' && 'toString' in key && typeof (key as any).toString === 'function') {
      return new PublicKey((key as any).toString());
    }
    
    throw new Error('Invalid public key format');
  } catch (error) {
    throw new Error(`Invalid public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
