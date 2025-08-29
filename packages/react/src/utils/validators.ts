import { PublicKey } from '@solana/web3.js';

// =============================================================================
// SIMPLE VALIDATORS
// =============================================================================

export const validateAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

export const validateTimestamp = (timestamp: number): boolean => {
  return timestamp > Date.now();
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateDateTime = (dateString: string, timeString: string): boolean => {
  if (!dateString || !timeString) return false;
  
  const timestamp = new Date(`${dateString}T${timeString}`).getTime();
  return validateTimestamp(timestamp);
};
