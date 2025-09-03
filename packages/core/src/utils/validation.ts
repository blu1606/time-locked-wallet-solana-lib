import { PublicKey } from '@solana/web3.js'

/**
 * Validates and normalizes a public key from various input formats
 * Handles wallet adapter objects, strings, and PublicKey instances
 */
export function validateAndNormalizePublicKey(key: string | PublicKey | null | undefined): PublicKey {
  if (!key) {
    throw new Error('Public key is required')
  }
  
  try {
    // If it's already a PublicKey instance, validate it's valid
    if (key instanceof PublicKey) {
      // Ensure it's a valid key by calling toBase58()
      key.toBase58()
      return key
    }
    
    // If it's a string, create new PublicKey
    if (typeof key === 'string') {
      return new PublicKey(key)
    }
    
    // If it has toString method (wallet adapter case)
    if (key && typeof key === 'object' && 'toString' in key && typeof (key as any).toString === 'function') {
      return new PublicKey((key as any).toString())
    }
    
    throw new Error('Invalid public key format')
  } catch (error) {
    throw new Error(`Invalid public key: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Safely converts a public key to string, returns null if invalid
 */
export function safePublicKeyString(key: string | PublicKey | null | undefined): string | null {
  try {
    return validateAndNormalizePublicKey(key).toString()
  } catch {
    return null
  }
}

/**
 * Validates that a public key string is valid
 */
export function isValidPublicKey(key: string): boolean {
  try {
    new PublicKey(key)
    return true
  } catch {
    return false
  }
}
