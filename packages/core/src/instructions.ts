import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { 
    AssetType,
    CreateTimeLockParams, 
    DepositParams,
    TokenDepositParams,
    WithdrawParams,
    TokenWithdrawParams,
    TransactionResult,
    findTimeLockPDA,
    validateTimestamp,
    validateAmount,
    validatePublicKey,
    TOKEN_PROGRAM_ID 
} from "./types";
import { TimeLockBuilders } from "./builders";

/**
 * High-level instruction helpers for Time-Locked Wallet operations
 */
export class TimeLockInstructions {
    private program: anchor.Program;
    private builders: TimeLockBuilders;

    constructor(program: anchor.Program) {
        this.program = program;
        this.builders = new TimeLockBuilders(program);
    }

    // ========================================================================
    // SOL OPERATIONS
    // ========================================================================

    /**
     * Create a SOL time-locked wallet
     */
    async createSolTimeLock(params: CreateTimeLockParams): Promise<TransactionResult> {
        try {
            validateTimestamp(params.unlockTimestamp);
            validatePublicKey(params.owner);

            const [timeLockAccount, bump] = await findTimeLockPDA(
                params.owner, 
                params.unlockTimestamp, 
                this.program.programId
            );

            let instructions: TransactionInstruction[] = [];

            if (params.amount && params.amount > 0) {
                // Create and deposit in one transaction
                instructions = await this.builders.buildSolCreateAndDeposit(params);
            } else {
                // Just create
                const instruction = await this.builders.buildSolInitialize(params);
                instructions = [instruction];
            }

            const transaction = new Transaction().add(...instructions);

            return {
                transaction,
                timeLockAccount,
                assetType: AssetType.Sol,
                instructions
            };
        } catch (error) {
            throw new Error(`Failed to create SOL time lock: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deposit SOL to existing time-locked wallet
     */
    async depositSol(params: DepositParams): Promise<TransactionResult> {
        try {
            validateAmount(params.amount);
            validatePublicKey(params.timeLockAccount);

            const instruction = await this.builders.buildSolDeposit(params);
            const transaction = new Transaction().add(instruction);

            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Sol,
                instructions: [instruction]
            };
        } catch (error) {
            throw new Error(`Failed to deposit SOL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Withdraw SOL from time-locked wallet
     */
    async withdrawSol(params: WithdrawParams): Promise<TransactionResult> {
        try {
            validatePublicKey(params.timeLockAccount);
            validatePublicKey(params.owner);

            const instruction = await this.builders.buildSolWithdraw(params);
            const transaction = new Transaction().add(instruction);

            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Sol,
                instructions: [instruction]
            };
        } catch (error) {
            throw new Error(`Failed to withdraw SOL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========================================================================
    // TOKEN OPERATIONS
    // ========================================================================

    /**
     * Create a Token time-locked wallet
     */
    async createTokenTimeLock(
        params: CreateTimeLockParams,
        depositParams?: Omit<TokenDepositParams, 'timeLockAccount'>
    ): Promise<TransactionResult> {
        try {
            validateTimestamp(params.unlockTimestamp);
            validatePublicKey(params.owner);

            const [timeLockAccount, bump] = await findTimeLockPDA(
                params.owner, 
                params.unlockTimestamp, 
                this.program.programId
            );

            let instructions: TransactionInstruction[] = [];

            if (depositParams && depositParams.amount && depositParams.amount > 0) {
                // Create and deposit in one transaction
                instructions = await this.builders.buildTokenCreateAndDeposit(params, depositParams);
            } else {
                // Just create
                const instruction = await this.builders.buildTokenInitialize(params);
                instructions = [instruction];
            }

            const transaction = new Transaction().add(...instructions);

            return {
                transaction,
                timeLockAccount,
                assetType: AssetType.Token,
                instructions
            };
        } catch (error) {
            throw new Error(`Failed to create token time lock: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deposit tokens to existing time-locked wallet
     */
    async depositToken(params: TokenDepositParams): Promise<TransactionResult> {
        try {
            validateAmount(params.amount);
            validatePublicKey(params.timeLockAccount);
            validatePublicKey(params.tokenFromAta);
            validatePublicKey(params.tokenVault);

            const instruction = await this.builders.buildTokenDeposit(params);
            const transaction = new Transaction().add(instruction);

            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Token,
                instructions: [instruction]
            };
        } catch (error) {
            throw new Error(`Failed to deposit token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Withdraw tokens from time-locked wallet
     */
    async withdrawToken(params: TokenWithdrawParams): Promise<TransactionResult> {
        try {
            validatePublicKey(params.timeLockAccount);
            validatePublicKey(params.owner);
            validatePublicKey(params.tokenFromVault);
            validatePublicKey(params.tokenToAta);

            const instruction = await this.builders.buildTokenWithdraw(params);
            const transaction = new Transaction().add(instruction);

            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Token,
                instructions: [instruction]
            };
        } catch (error) {
            throw new Error(`Failed to withdraw token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * Get time-locked wallet account data
     */
    async getTimeLockData(timeLockAccount: PublicKey) {
        try {
            // Note: In a real implementation, you would use the proper account type from your IDL
            // For now, we'll use the RPC connection directly
            const accountInfo = await this.program.provider.connection.getAccountInfo(timeLockAccount);
            if (!accountInfo) {
                throw new Error('Account not found');
            }
            // This would normally be deserialized using the proper account coder
            return accountInfo;
        } catch (error) {
            throw new Error(`Failed to fetch time lock data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check if time lock can be withdrawn (unlocked)
     */
    async canWithdraw(timeLockAccount: PublicKey): Promise<boolean> {
        try {
            const accountInfo = await this.getTimeLockData(timeLockAccount);
            // In a real implementation, you would deserialize the account data
            // For now, we'll return false to indicate that this needs proper implementation
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get remaining lock time in seconds
     */
    async getRemainingLockTime(timeLockAccount: PublicKey): Promise<number> {
        try {
            const accountInfo = await this.getTimeLockData(timeLockAccount);
            // In a real implementation, you would deserialize the account data to get the unlock timestamp
            // For now, we'll return 0 to indicate that this needs proper implementation
            return 0;
        } catch (error) {
            return 0;
        }
    }
}
