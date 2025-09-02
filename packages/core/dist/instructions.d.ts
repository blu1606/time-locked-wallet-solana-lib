import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { CreateTimeLockParams, DepositParams, TokenDepositParams, WithdrawParams, TokenWithdrawParams, TransactionResult } from "./types";
/**
 * High-level instruction helpers for Time-Locked Wallet operations
 */
export declare class TimeLockInstructions {
    private program;
    private builders;
    private normalizePublicKey;
    constructor(program: anchor.Program);
    /**
     * Create a SOL time-locked wallet
     */
    createSolTimeLock(params: CreateTimeLockParams): Promise<TransactionResult>;
    /**
     * Deposit SOL to existing time-locked wallet
     */
    depositSol(params: DepositParams): Promise<TransactionResult>;
    /**
     * Withdraw SOL from time-locked wallet
     */
    withdrawSol(params: WithdrawParams): Promise<TransactionResult>;
    /**
     * Create a Token time-locked wallet
     */
    createTokenTimeLock(params: CreateTimeLockParams, depositParams?: Omit<TokenDepositParams, 'timeLockAccount'>): Promise<TransactionResult>;
    /**
     * Deposit tokens to existing time-locked wallet
     */
    depositToken(params: TokenDepositParams): Promise<TransactionResult>;
    /**
     * Withdraw tokens from time-locked wallet
     */
    withdrawToken(params: TokenWithdrawParams): Promise<TransactionResult>;
    /**
     * Get time-locked wallet account data
     */
    getTimeLockData(timeLockAccount: PublicKey): Promise<anchor.web3.AccountInfo<Buffer>>;
    /**
     * Check if time lock can be withdrawn (unlocked)
     */
    canWithdraw(timeLockAccount: PublicKey): Promise<boolean>;
    /**
     * Get remaining lock time in seconds
     */
    getRemainingLockTime(timeLockAccount: PublicKey): Promise<number>;
}
