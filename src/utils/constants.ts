// Application constants
export const APP_CONFIG = {
  NAME: 'Time-Locked Wallet',
  VERSION: '1.0.0',
  DESCRIPTION: 'Secure time-locked wallet for Solana blockchain',
  NETWORK: 'devnet' as const,
  PROGRAM_ID: '899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g',
  COMMITMENT: 'confirmed' as const,
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 4000,
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_AMOUNT_DECIMALS: 9,
  MIN_LOCK_DURATION_HOURS: 1,
  MAX_LOCK_DURATION_DAYS: 365,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INVALID_AMOUNT: 'Invalid amount',
  INVALID_DATE: 'Unlock time must be in the future',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network connection error',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  TOKEN_NOT_SUPPORTED: 'Token not supported yet',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: 'Time-lock wallet created successfully',
  DEPOSIT_SUCCESS: 'Deposit successful',
  WITHDRAW_SUCCESS: 'Withdrawal successful',
  TRANSACTION_SUCCESS: 'Transaction successful',
} as const;
