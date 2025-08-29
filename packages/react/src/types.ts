import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// =============================================================================
// BASIC TYPES FOR LIBRARY
// =============================================================================

export enum AssetType {
  Sol = "sol",
  Token = "token"
}

export interface WalletInfo {
  owner: PublicKey;
  unlockTimestamp: anchor.BN;
  assetType: AssetType;
  amount: anchor.BN;
  tokenVault: PublicKey;
  isUnlocked: boolean;
  timeRemaining: anchor.BN;
}

export interface CreateTimeLockParams {
  owner: PublicKey;
  unlockTimestamp: number;
  assetType: AssetType;
  amount?: number;
}

export interface DepositParams {
  timeLockAccount: PublicKey;
  amount: number;
}

export interface WithdrawParams {
  timeLockAccount: PublicKey;
}

export interface TimeLockConfig {
  programId: string;
  cluster: 'mainnet' | 'devnet' | 'testnet' | 'localhost';
}

// Mock client interface
export interface TimeLockClient {
  createTimeLock: (params: CreateTimeLockParams) => Promise<PublicKey>;
  deposit: (params: DepositParams) => Promise<string>;
  withdraw: (params: WithdrawParams) => Promise<string>;
  getWalletInfo: (address: PublicKey) => Promise<WalletInfo>;
}
