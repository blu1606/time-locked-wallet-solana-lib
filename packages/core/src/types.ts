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
export enum AssetType {
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
export const TimeLockErrors = {
    INVALID_AMOUNT: "Amount must be greater than 0",
    INVALID_TIMESTAMP: "Unlock timestamp must be in the future",
    ACCOUNT_NOT_FOUND: "TimeLock account not found",
    FETCH_FAILED: "Failed to fetch account data",
    INVALID_PROVIDER: "Either workspace or programId must be provided",
    IDL_NOT_IMPLEMENTED: "Direct IDL loading not implemented. Use workspace mode or implement IDL loading.",
    WITHDRAWAL_TOO_EARLY: "Withdrawal is not yet available. The unlock timestamp has not been reached.",
    INVALID_ASSET_TYPE: "Invalid asset type for this operation.",
    INVALID_TOKEN_VAULT: "Invalid token vault account.",
} as const;

/**
 * Program constants for Time-Locked Wallet
 */
export const PROGRAM_CONSTANTS = {
    PROGRAM_ID: new PublicKey("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g"),
    SEEDS: {
        TIME_LOCK: "time_lock",
    },
    ACCOUNT_SIZE: {
        TIME_LOCK_ACCOUNT: 8 + 32 + 8 + 1 + 1 + 8 + 32, // 90 bytes
    },
} as const;

/**
 * RPC endpoints for different clusters
 */
export const RPC_ENDPOINTS = {
    mainnet: "https://api.mainnet-beta.solana.com",
    devnet: "https://api.devnet.solana.com",
    testnet: "https://api.testnet.solana.com",
    localhost: "http://localhost:8899",
} as const;

/**
 * Time constants for convenience
 */
export const TIME_CONSTANTS = {
    SECOND: 1,
    MINUTE: 60,
    HOUR: 60 * 60,
    DAY: 24 * 60 * 60,
    WEEK: 7 * 24 * 60 * 60,
    MONTH: 30 * 24 * 60 * 60,
    YEAR: 365 * 24 * 60 * 60,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current Unix timestamp in seconds.
 */
export function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

/**
 * Create a timestamp for a future date.
 * @param days Number of days from now.
 * @param hours Number of hours from now (optional).
 * @param minutes Number of minutes from now (optional).
 * @returns Unix timestamp for the specified future date.
 */
export function createFutureTimestamp(
    days: number, 
    hours: number = 0, 
    minutes: number = 0
): number {
    const now = getCurrentTimestamp();
    const futureTime = now + (days * TIME_CONSTANTS.DAY) + 
                      (hours * TIME_CONSTANTS.HOUR) + 
                      (minutes * TIME_CONSTANTS.MINUTE);
    return futureTime;
}

/**
 * Format timestamp to human readable date string.
 * @param timestamp Unix timestamp in seconds.
 * @returns Formatted date string.
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Calculate time remaining until unlock.
 * @param unlockTimestamp The unlock timestamp.
 * @returns Seconds remaining (0 if already unlocked).
 */
export function getTimeRemaining(unlockTimestamp: number): number {
    const now = getCurrentTimestamp();
    return Math.max(0, unlockTimestamp - now);
}

/**
 * Check if a timestamp is in the future.
 * @param timestamp The timestamp to check.
 * @returns True if timestamp is in the future.
 */
export function isTimestampInFuture(timestamp: number): boolean {
    return timestamp > getCurrentTimestamp();
}

/**
 * Format duration in seconds to human readable string.
 * @param seconds Duration in seconds.
 * @returns Human readable duration string.
 */
export function formatDuration(seconds: number): string {
    if (seconds === 0) return "Unlocked";
    
    const days = Math.floor(seconds / TIME_CONSTANTS.DAY);
    const hours = Math.floor((seconds % TIME_CONSTANTS.DAY) / TIME_CONSTANTS.HOUR);
    const minutes = Math.floor((seconds % TIME_CONSTANTS.HOUR) / TIME_CONSTANTS.MINUTE);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(" ") || "< 1m";
}

/**
 * Convert SOL to lamports.
 * @param sol Amount in SOL.
 * @returns Amount in lamports.
 */
export function solToLamports(sol: number): number {
    return sol * anchor.web3.LAMPORTS_PER_SOL;
}

/**
 * Convert lamports to SOL.
 * @param lamports Amount in lamports.
 * @returns Amount in SOL.
 */
export function lamportsToSol(lamports: number | anchor.BN): number {
    const lamportsBN = typeof lamports === 'number' ? new anchor.BN(lamports) : lamports;
    return lamportsBN.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
}

/**
 * Validate amount is greater than zero.
 * @param amount The amount to validate.
 * @throws Error if amount is not greater than zero.
 */
export function validateAmount(amount: number): void {
    if (amount <= 0) {
        throw new Error(TimeLockErrors.INVALID_AMOUNT);
    }
}

/**
 * Validate timestamp is in the future.
 * @param timestamp The timestamp to validate.
 * @throws Error if timestamp is not in the future.
 */
export function validateTimestamp(timestamp: number): void {
    if (!isTimestampInFuture(timestamp)) {
        throw new Error(TimeLockErrors.INVALID_TIMESTAMP);
    }
}

/**
 * Find the PDA for a time-locked wallet account.
 * @param owner The public key of the account owner.
 * @param unlockTimestamp The unlock timestamp.
 * @param programId The program ID.
 * @returns A promise resolving to an array containing the PDA and its bump seed.
 */
export async function findTimeLockPDA(
    owner: PublicKey, 
    unlockTimestamp: number, 
    programId: PublicKey
): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
        [
            anchor.utils.bytes.utf8.encode("time_lock"),
            owner.toBuffer(),
            new anchor.BN(unlockTimestamp).toArrayLike(Buffer, "le", 8),
        ],
        programId
    );
}

// ========================================================================
// Additional Required Exports
// ========================================================================

/**
 * Transaction result interface
 */
export interface TransactionResult {
    transaction: any; // Transaction
    timeLockAccount: PublicKey;
    assetType: AssetType;
    instructions: any[]; // TransactionInstruction[]
}

// Common constants
// Program ID used by the client when no programId is provided. Set to deployed program.
export const PROGRAM_ID = new PublicKey("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g");
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// Error messages
export const ERROR_MESSAGES = {
    CREATION_FAILED: "Failed to create time lock",
    DEPOSIT_FAILED: "Failed to deposit",
    WITHDRAWAL_FAILED: "Failed to withdraw",
    FETCH_FAILED: "Failed to fetch data",
    INVALID_TIMESTAMP: "Invalid timestamp",
    INVALID_AMOUNT: "Invalid amount",
    INVALID_PUBLIC_KEY: "Invalid public key"
};

/**
 * Validate a public key
 */
export function validatePublicKey(key: PublicKey | string | any): void {
    try {
        if (!key) throw new Error(ERROR_MESSAGES.INVALID_PUBLIC_KEY);

        // Allow callers to pass either a PublicKey instance or a base58 string
        let pk: PublicKey;
        if (typeof key === 'string') {
            pk = new PublicKey(key);
        } else if (key instanceof PublicKey) {
            pk = key;
        } else if (key && typeof key.toBuffer === 'function') {
            // Some adapters provide a compatible object with toBuffer()
            pk = new PublicKey(key.toBuffer());
        } else {
            // Try constructing; will throw if invalid
            pk = new PublicKey(key);
        }

        // Ensure the underlying public key bytes represent a valid curve point
        const bytes = pk.toBuffer();
        if (!PublicKey.isOnCurve(bytes)) {
            throw new Error(ERROR_MESSAGES.INVALID_PUBLIC_KEY);
        }
    } catch (e) {
        throw new Error(ERROR_MESSAGES.INVALID_PUBLIC_KEY);
    }
}
