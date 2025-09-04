import { ERROR_MESSAGES, UI_CONFIG } from './constants';

// Validation utilities
export class ValidationUtils {
  // Validate amount input
  static validateAmount(amount: string, decimals: number = 9): { isValid: boolean; error?: string } {
    if (!amount || amount.trim() === '') {
      return { isValid: false, error: 'Please enter amount' };
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Invalid amount' };
    }

    if (numAmount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    // Check decimal places
    const decimalPlaces = amount.split('.')[1]?.length || 0;
    if (decimalPlaces > decimals) {
      return { isValid: false, error: `Maximum ${decimals} decimal places` };
    }

    return { isValid: true };
  }

  // Validate unlock date
  static validateUnlockDate(dateString: string): { isValid: boolean; error?: string } {
    if (!dateString) {
      return { isValid: false, error: 'Please select unlock time' };
    }

    // Parse the date string as local time (Vietnam time)
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create date object in local timezone
    const unlockDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();

    if (isNaN(unlockDate.getTime())) {
      return { isValid: false, error: 'Invalid date' };
    }

    // Add 1 minute buffer to avoid edge cases
    const bufferTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute buffer
    
    if (unlockDate <= bufferTime) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_DATE };
    }

    // Check maximum lock duration
    const maxLockTime = new Date(now.getTime() + UI_CONFIG.MAX_LOCK_DURATION_DAYS * 24 * 60 * 60 * 1000);
    if (unlockDate > maxLockTime) {
      return { isValid: false, error: `Maximum lock duration is ${UI_CONFIG.MAX_LOCK_DURATION_DAYS} days` };
    }

    return { isValid: true };
  }

  // Validate wallet connection
  static validateWalletConnection(connected: boolean, publicKey: any): { isValid: boolean; error?: string } {
    if (!connected || !publicKey) {
      return { isValid: false, error: ERROR_MESSAGES.WALLET_NOT_CONNECTED };
    }
    return { isValid: true };
  }

  // Format validation error
  static formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }
}
