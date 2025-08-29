import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { 
    AssetType, 
    CreateTimeLockParams, 
    DepositParams,
    TokenDepositParams,
    WithdrawParams,
    TokenWithdrawParams,
    LockCreationResult,
    validateAmount, 
    validateTimestamp, 
    findTimeLockPDA 
} from "./types";

/**
 * Simplified transaction builders for Time-Locked Wallet operations
 */
export class TimeLockBuilders {
    private program: anchor.Program;

    constructor(program: anchor.Program) {
        this.program = program;
    }

    // ========================================================================
    // SOL OPERATIONS
    // ========================================================================

    /**
     * Build instruction to initialize a SOL time-locked wallet
     */
    async buildSolInitialize(params: CreateTimeLockParams): Promise<TransactionInstruction> {
        validateTimestamp(params.unlockTimestamp);

        const [timeLockAccount] = await findTimeLockPDA(
            params.owner, 
            params.unlockTimestamp, 
            this.program.programId
        );

        return await this.program.methods
            .initialize(new anchor.BN(params.unlockTimestamp), { sol: {} })
            .accounts({
                timeLockAccount: timeLockAccount,
                initializer: params.owner,
                systemProgram: SystemProgram.programId,
            })
            .instruction();
    }

    /**
     * Build instruction to deposit SOL
     */
    async buildSolDeposit(params: DepositParams): Promise<TransactionInstruction> {
        validateAmount(params.amount);

        const signerKey = params.depositor || this.program.provider.wallet.publicKey;

        return await this.program.methods
            .depositSol(new anchor.BN(params.amount))
            .accounts({
                timeLockAccount: params.timeLockAccount,
                initializer: signerKey,
                systemProgram: SystemProgram.programId,
            })
            .instruction();
    }

    /**
     * Build instruction to withdraw SOL
     */
    async buildSolWithdraw(params: WithdrawParams): Promise<TransactionInstruction> {
        return await this.program.methods
            .withdrawSol()
            .accounts({
                timeLockAccount: params.timeLockAccount,
                owner: params.owner,
                systemProgram: SystemProgram.programId,
            })
            .instruction();
    }

    // ========================================================================
    // TOKEN OPERATIONS
    // ========================================================================

    /**
     * Build instruction to initialize a Token time-locked wallet
     */
    async buildTokenInitialize(params: CreateTimeLockParams): Promise<TransactionInstruction> {
        validateTimestamp(params.unlockTimestamp);

        const [timeLockAccount] = await findTimeLockPDA(
            params.owner, 
            params.unlockTimestamp, 
            this.program.programId
        );

        return await this.program.methods
            .initialize(new anchor.BN(params.unlockTimestamp), { token: {} })
            .accounts({
                timeLockAccount: timeLockAccount,
                initializer: params.owner,
                systemProgram: SystemProgram.programId,
            })
            .instruction();
    }

    /**
     * Build instruction to deposit tokens
     */
    async buildTokenDeposit(params: TokenDepositParams): Promise<TransactionInstruction> {
        validateAmount(params.amount);

        const signerKey = params.depositor || this.program.provider.wallet.publicKey;

        return await this.program.methods
            .depositToken(new anchor.BN(params.amount))
            .accounts({
                timeLockAccount: params.timeLockAccount,
                initializer: signerKey,
                tokenFromAta: params.tokenFromAta,
                tokenVault: params.tokenVault,
                tokenProgram: params.tokenProgramId,
            })
            .instruction();
    }

    /**
     * Build instruction to withdraw tokens
     */
    async buildTokenWithdraw(params: TokenWithdrawParams): Promise<TransactionInstruction> {
        return await this.program.methods
            .withdrawToken()
            .accounts({
                timeLockAccount: params.timeLockAccount,
                owner: params.owner,
                tokenFromVault: params.tokenFromVault,
                tokenToAta: params.tokenToAta,
                tokenProgram: params.tokenProgramId,
            })
            .instruction();
    }

    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================

    /**
     * Build complete transaction for creating and depositing SOL
     */
    async buildSolCreateAndDeposit(params: CreateTimeLockParams): Promise<TransactionInstruction[]> {
        if (!params.amount || params.amount <= 0) {
            throw new Error("Amount is required for create and deposit operation");
        }

        const [timeLockAccount] = await findTimeLockPDA(
            params.owner, 
            params.unlockTimestamp, 
            this.program.programId
        );

        const initInstruction = await this.buildSolInitialize(params);
        const depositInstruction = await this.buildSolDeposit({
            timeLockAccount,
            amount: params.amount,
            depositor: params.owner
        });

        return [initInstruction, depositInstruction];
    }

    /**
     * Build complete transaction for creating and depositing tokens
     */
    async buildTokenCreateAndDeposit(
        params: CreateTimeLockParams, 
        depositParams: Omit<TokenDepositParams, 'timeLockAccount'>
    ): Promise<TransactionInstruction[]> {
        if (!depositParams.amount || depositParams.amount <= 0) {
            throw new Error("Amount is required for create and deposit operation");
        }

        const [timeLockAccount] = await findTimeLockPDA(
            params.owner, 
            params.unlockTimestamp, 
            this.program.programId
        );

        const initInstruction = await this.buildTokenInitialize(params);
        const depositInstruction = await this.buildTokenDeposit({
            ...depositParams,
            timeLockAccount
        });

        return [initInstruction, depositInstruction];
    }
}
