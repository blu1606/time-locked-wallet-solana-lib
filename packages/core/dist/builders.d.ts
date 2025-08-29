import * as anchor from "@coral-xyz/anchor";
import { TransactionInstruction } from "@solana/web3.js";
import { CreateTimeLockParams, DepositParams, TokenDepositParams, WithdrawParams, TokenWithdrawParams } from "./types";
/**
 * Simplified transaction builders for Time-Locked Wallet operations
 */
export declare class TimeLockBuilders {
    private program;
    constructor(program: anchor.Program);
    /**
     * Build instruction to initialize a SOL time-locked wallet
     */
    buildSolInitialize(params: CreateTimeLockParams): Promise<TransactionInstruction>;
    /**
     * Build instruction to deposit SOL
     */
    buildSolDeposit(params: DepositParams): Promise<TransactionInstruction>;
    /**
     * Build instruction to withdraw SOL
     */
    buildSolWithdraw(params: WithdrawParams): Promise<TransactionInstruction>;
    /**
     * Build instruction to initialize a Token time-locked wallet
     */
    buildTokenInitialize(params: CreateTimeLockParams): Promise<TransactionInstruction>;
    /**
     * Build instruction to deposit tokens
     */
    buildTokenDeposit(params: TokenDepositParams): Promise<TransactionInstruction>;
    /**
     * Build instruction to withdraw tokens
     */
    buildTokenWithdraw(params: TokenWithdrawParams): Promise<TransactionInstruction>;
    /**
     * Build complete transaction for creating and depositing SOL
     */
    buildSolCreateAndDeposit(params: CreateTimeLockParams): Promise<TransactionInstruction[]>;
    /**
     * Build complete transaction for creating and depositing tokens
     */
    buildTokenCreateAndDeposit(params: CreateTimeLockParams, depositParams: Omit<TokenDepositParams, 'timeLockAccount'>): Promise<TransactionInstruction[]>;
}
