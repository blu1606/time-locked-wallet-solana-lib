import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
/**
 * Information about a time-locked wallet returned by getWalletInfo.
 */
export interface WalletInfo {
    owner: PublicKey;
    unlockTimestamp: anchor.BN;
    assetType: AssetType;
    amount: anchor.BN;
    tokenVault: PublicKey;
    isUnlocked: boolean;
    timeRemaining: anchor.BN;
}
/**
 * Asset type enum for time-locked wallets.
 */
export declare enum AssetType {
    /** Solana native token (SOL) */
    Sol = "sol",
    /** SPL Token */
    Token = "token"
}
/**
 * Configuration for TimeLockClient
 */
export interface TimeLockConfig {
    programId: string;
    cluster: 'mainnet' | 'devnet' | 'testnet' | 'localhost';
    commitment?: anchor.web3.Commitment;
}
/**
 * Parameters for creating a time-locked wallet
 */
export interface CreateTimeLockParams {
    owner: PublicKey;
    unlockTimestamp: number;
    assetType: AssetType;
    amount?: number;
}
/**
 * Parameters for depositing assets
 */
export interface DepositParams {
    timeLockAccount: PublicKey;
    amount: number;
    depositor?: PublicKey;
}
/**
 * Parameters for token deposits
 */
export interface TokenDepositParams extends DepositParams {
    tokenFromAta: PublicKey;
    tokenVault: PublicKey;
    tokenProgramId: PublicKey;
}
/**
 * Parameters for withdrawing assets
 */
export interface WithdrawParams {
    timeLockAccount: PublicKey;
    owner: PublicKey;
}
/**
 * Parameters for token withdrawals
 */
export interface TokenWithdrawParams extends WithdrawParams {
    tokenFromVault: PublicKey;
    tokenToAta: PublicKey;
    tokenProgramId: PublicKey;
}
/**
 * Result from successful lock creation
 */
export interface LockCreationResult {
    signature: anchor.web3.TransactionSignature;
    timeLockAccount: PublicKey;
    assetType: AssetType;
}
/**
 * Error messages used by the TimeLockClient.
 */
export declare const TimeLockErrors: {
    readonly INVALID_AMOUNT: "Amount must be greater than 0";
    readonly INVALID_TIMESTAMP: "Unlock timestamp must be in the future";
    readonly ACCOUNT_NOT_FOUND: "TimeLock account not found";
    readonly FETCH_FAILED: "Failed to fetch account data";
    readonly INVALID_PROVIDER: "Either workspace or programId must be provided";
    readonly IDL_NOT_IMPLEMENTED: "Direct IDL loading not implemented. Use workspace mode or implement IDL loading.";
    readonly WITHDRAWAL_TOO_EARLY: "Withdrawal is not yet available. The unlock timestamp has not been reached.";
    readonly INVALID_ASSET_TYPE: "Invalid asset type for this operation.";
    readonly INVALID_TOKEN_VAULT: "Invalid token vault account.";
};
/**
 * Program constants for Time-Locked Wallet
 */
export declare const PROGRAM_CONSTANTS: {
    readonly PROGRAM_ID: anchor.web3.PublicKey;
    readonly SEEDS: {
        readonly TIME_LOCK: "time_lock";
    };
    readonly ACCOUNT_SIZE: {
        readonly TIME_LOCK_ACCOUNT: number;
    };
};
/**
 * RPC endpoints for different clusters
 */
export declare const RPC_ENDPOINTS: {
    readonly mainnet: "https://api.mainnet-beta.solana.com";
    readonly devnet: "https://api.devnet.solana.com";
    readonly testnet: "https://api.testnet.solana.com";
    readonly localhost: "http://localhost:8899";
};
/**
 * Time constants for convenience
 */
export declare const TIME_CONSTANTS: {
    readonly SECOND: 1;
    readonly MINUTE: 60;
    readonly HOUR: number;
    readonly DAY: number;
    readonly WEEK: number;
    readonly MONTH: number;
    readonly YEAR: number;
};
/**
 * Get the current Unix timestamp in seconds.
 */
export declare function getCurrentTimestamp(): number;
/**
 * Create a timestamp for a future date.
 * @param days Number of days from now.
 * @param hours Number of hours from now (optional).
 * @param minutes Number of minutes from now (optional).
 * @returns Unix timestamp for the specified future date.
 */
export declare function createFutureTimestamp(days: number, hours?: number, minutes?: number): number;
/**
 * Format timestamp to human readable date string.
 * @param timestamp Unix timestamp in seconds.
 * @returns Formatted date string.
 */
export declare function formatTimestamp(timestamp: number): string;
/**
 * Calculate time remaining until unlock.
 * @param unlockTimestamp The unlock timestamp.
 * @returns Seconds remaining (0 if already unlocked).
 */
export declare function getTimeRemaining(unlockTimestamp: number): number;
/**
 * Check if a timestamp is in the future.
 * @param timestamp The timestamp to check.
 * @returns True if timestamp is in the future.
 */
export declare function isTimestampInFuture(timestamp: number): boolean;
/**
 * Format duration in seconds to human readable string.
 * @param seconds Duration in seconds.
 * @returns Human readable duration string.
 */
export declare function formatDuration(seconds: number): string;
/**
 * Convert SOL to lamports.
 * @param sol Amount in SOL.
 * @returns Amount in lamports.
 */
export declare function solToLamports(sol: number): number;
/**
 * Convert lamports to SOL.
 * @param lamports Amount in lamports.
 * @returns Amount in SOL.
 */
export declare function lamportsToSol(lamports: number | anchor.BN): number;
/**
 * Validate amount is greater than zero.
 * @param amount The amount to validate.
 * @throws Error if amount is not greater than zero.
 */
export declare function validateAmount(amount: number): void;
/**
 * Validate timestamp is in the future.
 * @param timestamp The timestamp to validate.
 * @throws Error if timestamp is not in the future.
 */
export declare function validateTimestamp(timestamp: number): void;
/**
 * Find the PDA for a time-locked wallet account.
 * @param owner The public key of the account owner.
 * @param unlockTimestamp The unlock timestamp.
 * @param programId The program ID.
 * @returns A promise resolving to an array containing the PDA and its bump seed.
 */
export declare function findTimeLockPDA(owner: PublicKey, unlockTimestamp: number, programId: PublicKey): Promise<[PublicKey, number]>;
/**
 * Transaction result interface
 */
export interface TransactionResult {
    transaction: any;
    timeLockAccount: PublicKey;
    assetType: AssetType;
    instructions: any[];
}
export declare const PROGRAM_ID: anchor.web3.PublicKey;
export declare const TOKEN_PROGRAM_ID: anchor.web3.PublicKey;
export declare const ERROR_MESSAGES: {
    CREATION_FAILED: string;
    DEPOSIT_FAILED: string;
    WITHDRAWAL_FAILED: string;
    FETCH_FAILED: string;
    INVALID_TIMESTAMP: string;
    INVALID_AMOUNT: string;
    INVALID_PUBLIC_KEY: string;
};
/**
 * Validate a public key
 */
export declare function validatePublicKey(key: PublicKey | string | any): void;
