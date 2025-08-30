import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Asset type enum matching smart contract
export enum AssetType {
  Sol = "Sol",
  Token = "Token"
}

// Time lock account structure from smart contract
export interface TimeLockAccount {
  owner: PublicKey;
  unlockTimestamp: BN;
  assetType: AssetType;
  bump: number;
  amount: BN;
  tokenVault: PublicKey;
}

// Wallet info returned by get_wallet_info
export interface WalletInfo {
  owner: PublicKey;
  unlockTimestamp: BN;
  assetType: AssetType;
  amount: BN;
  tokenVault: PublicKey;
  isUnlocked: boolean;
  timeRemaining: BN;
}

// Parameters for initializing a time lock
export interface InitializeParams {
  unlockTimestamp: number; // Unix timestamp
  assetType: AssetType;
}

// Parameters for depositing funds
export interface DepositParams {
  amount: number; // in lamports for SOL, in token units for SPL
  timeLockAccount: PublicKey;
}

// Time lock data with public key
export interface TimeLockData {
  publicKey: PublicKey;
  account: TimeLockAccount;
  walletInfo?: WalletInfo;
}

// Program context interface
export interface ProgramContextType {
  program: any;
  connection: any;
  programId: PublicKey;
  
  // Core functions
  initialize: (params: InitializeParams) => Promise<{ publicKey: PublicKey; signature: string }>;
  depositSol: (params: DepositParams) => Promise<string>;
  depositToken: (params: DepositParams & { tokenMint: PublicKey }) => Promise<string>;
  withdrawSol: (timeLockAccount: PublicKey) => Promise<string>;
  withdrawToken: (timeLockAccount: PublicKey, tokenMint: PublicKey) => Promise<string>;
  getWalletInfo: (timeLockAccount: PublicKey) => Promise<WalletInfo>;
  
  // Utility functions
  getUserTimeLocks: (userPublicKey: PublicKey) => Promise<TimeLockData[]>;
  getTimeLockPDA: (owner: PublicKey, unlockTimestamp: number) => [PublicKey, number];
}
