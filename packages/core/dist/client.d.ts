import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { CreateTimeLockParams, DepositParams, TokenDepositParams, WithdrawParams, TokenWithdrawParams, LockCreationResult } from "./types";
/**
 * Production Time-Locked Wallet Client
 *
 * This client provides full Anchor integration for the Time-Locked Wallet program.
 * Requires the actual IDL and proper program initialization.
 */
export declare class TimeLockClient {
    private connection;
    private wallet;
    private program;
    private instructions;
    constructor(connection: Connection, wallet: anchor.Wallet, programId?: PublicKey);
    /**
     * Create a new SOL time-locked wallet
     */
    createSolTimeLock(params: CreateTimeLockParams): Promise<LockCreationResult>;
    /**
     * Deposit SOL to an existing time-locked wallet
     */
    depositSol(params: DepositParams): Promise<string>;
    /**
     * Withdraw SOL from a time-locked wallet (only if unlocked)
     */
    withdrawSol(params: WithdrawParams): Promise<string>;
    /**
     * Create a new Token time-locked wallet
     */
    createTokenTimeLock(params: CreateTimeLockParams, depositParams?: Omit<TokenDepositParams, 'timeLockAccount'>): Promise<LockCreationResult>;
    /**
     * Deposit tokens to an existing time-locked wallet
     */
    depositToken(params: TokenDepositParams): Promise<string>;
    /**
     * Withdraw tokens from a time-locked wallet (only if unlocked)
     */
    withdrawToken(params: TokenWithdrawParams): Promise<string>;
    /**
     * Get time-locked wallet account data
     */
    getTimeLockData(timeLockAccount: PublicKey): Promise<anchor.web3.AccountInfo<Buffer<ArrayBufferLike>>>;
    /**
     * Check if a time-locked wallet can be withdrawn
     */
    canWithdraw(timeLockAccount: PublicKey): Promise<boolean>;
    /**
     * Get remaining lock time in seconds
     */
    getRemainingLockTime(timeLockAccount: PublicKey): Promise<number>;
    /**
     * Find the PDA for a time-locked wallet
     */
    findTimeLockPDA(owner: PublicKey, unlockTimestamp: number): Promise<[PublicKey, number]>;
    /**
     * Send and confirm a transaction
     */
    private sendAndConfirmTransaction;
    /**
     * Validate a public key
     */
    static validatePublicKey(key: PublicKey): void;
    /**
     * Validate a timestamp
     */
    static validateTimestamp(timestamp: number): void;
    /**
     * Validate an amount
     */
    static validateAmount(amount: number): void;
    /**
     * Create time lock PDA
     */
    static findTimeLockPDA(owner: PublicKey, unlockTimestamp: number, programId?: PublicKey): Promise<[PublicKey, number]>;
    get connectionInstance(): Connection;
    get walletInstance(): anchor.Wallet;
    get programInstance(): anchor.Program;
    get programId(): PublicKey;
}
