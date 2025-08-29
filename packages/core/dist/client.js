import * as anchor from "@coral-xyz/anchor";
import { IDL } from "./idl/types";
import { AssetType, PROGRAM_ID, ERROR_MESSAGES, validatePublicKey, validateTimestamp, validateAmount, findTimeLockPDA } from "./types";
import { TimeLockInstructions } from "./instructions";
/**
 * Production Time-Locked Wallet Client
 *
 * This client provides full Anchor integration for the Time-Locked Wallet program.
 * Requires the actual IDL and proper program initialization.
 */
export class TimeLockClient {
    constructor(connection, wallet, programId) {
        this.connection = connection;
        this.wallet = wallet;
        // Initialize Anchor provider
        const provider = new anchor.AnchorProvider(connection, wallet, {});
        anchor.setProvider(provider);
        // Use provided program ID or default
        const actualProgramId = programId || PROGRAM_ID;
        // Initialize program with real IDL - the program ID should be specified in the IDL itself
        // or we can override it by passing the programId as an option
        this.program = new anchor.Program(IDL, provider);
        // Initialize instruction helper
        this.instructions = new TimeLockInstructions(this.program);
    }
    // ========================================================================
    // SOL OPERATIONS
    // ========================================================================
    /**
     * Create a new SOL time-locked wallet
     */
    async createSolTimeLock(params) {
        try {
            const result = await this.instructions.createSolTimeLock(params);
            const signature = await this.sendAndConfirmTransaction(result.transaction);
            return {
                timeLockAccount: result.timeLockAccount,
                signature,
                assetType: AssetType.Sol
            };
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.CREATION_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deposit SOL to an existing time-locked wallet
     */
    async depositSol(params) {
        try {
            const result = await this.instructions.depositSol(params);
            return await this.sendAndConfirmTransaction(result.transaction);
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.DEPOSIT_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Withdraw SOL from a time-locked wallet (only if unlocked)
     */
    async withdrawSol(params) {
        try {
            const result = await this.instructions.withdrawSol(params);
            return await this.sendAndConfirmTransaction(result.transaction);
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.WITHDRAWAL_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ========================================================================
    // TOKEN OPERATIONS
    // ========================================================================
    /**
     * Create a new Token time-locked wallet
     */
    async createTokenTimeLock(params, depositParams) {
        try {
            const result = await this.instructions.createTokenTimeLock(params, depositParams);
            const signature = await this.sendAndConfirmTransaction(result.transaction);
            return {
                timeLockAccount: result.timeLockAccount,
                signature,
                assetType: AssetType.Token
            };
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.CREATION_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deposit tokens to an existing time-locked wallet
     */
    async depositToken(params) {
        try {
            const result = await this.instructions.depositToken(params);
            return await this.sendAndConfirmTransaction(result.transaction);
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.DEPOSIT_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Withdraw tokens from a time-locked wallet (only if unlocked)
     */
    async withdrawToken(params) {
        try {
            const result = await this.instructions.withdrawToken(params);
            return await this.sendAndConfirmTransaction(result.transaction);
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.WITHDRAWAL_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ========================================================================
    // QUERY OPERATIONS
    // ========================================================================
    /**
     * Get time-locked wallet account data
     */
    async getTimeLockData(timeLockAccount) {
        try {
            return await this.instructions.getTimeLockData(timeLockAccount);
        }
        catch (error) {
            throw new Error(`${ERROR_MESSAGES.FETCH_FAILED}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if a time-locked wallet can be withdrawn
     */
    async canWithdraw(timeLockAccount) {
        return await this.instructions.canWithdraw(timeLockAccount);
    }
    /**
     * Get remaining lock time in seconds
     */
    async getRemainingLockTime(timeLockAccount) {
        return await this.instructions.getRemainingLockTime(timeLockAccount);
    }
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    /**
     * Find the PDA for a time-locked wallet
     */
    async findTimeLockPDA(owner, unlockTimestamp) {
        return findTimeLockPDA(owner, unlockTimestamp, this.program.programId);
    }
    /**
     * Send and confirm a transaction
     */
    async sendAndConfirmTransaction(transaction) {
        try {
            // Ensure fee payer is set
            if (!transaction.feePayer) {
                // wallet may expose a publicKey (browser adapters) or a payer Keypair (node)
                if (this.wallet.publicKey)
                    transaction.feePayer = this.wallet.publicKey;
                else if (this.wallet.payer)
                    transaction.feePayer = this.wallet.payer.publicKey;
            }
            // Fetch a recent blockhash
            try {
                const latest = await this.connection.getLatestBlockhash();
                transaction.recentBlockhash = latest.blockhash || latest.recentBlockhash;
            }
            catch (e) {
                // ignore; sendTransaction may fill it in
            }
            // If wallet supports signTransaction (browser wallet adapter), use it
            if (typeof this.wallet.signTransaction === 'function') {
                const signed = await this.wallet.signTransaction(transaction);
                const raw = signed.serialize();
                try {
                    const signature = await this.connection.sendRawTransaction(raw);
                    await this.connection.confirmTransaction(signature, "confirmed");
                    return signature;
                }
                catch (sendErr) {
                    // If SendTransactionError, try to extract logs
                    if (sendErr && typeof sendErr.getLogs === 'function') {
                        const logs = await sendErr.getLogs();
                        throw new Error(`Transaction failed: ${sendErr.message}. Logs: ${JSON.stringify(logs)}`);
                    }
                    throw sendErr;
                }
            }
            // Otherwise assume a payer Keypair is provided on the wallet
            if (this.wallet.payer) {
                const signature = await this.connection.sendTransaction(transaction, [this.wallet.payer]);
                await this.connection.confirmTransaction(signature, "confirmed");
                return signature;
            }
            throw new Error('No signer available on wallet to send transaction');
        }
        catch (error) {
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ========================================================================
    // STATIC UTILITY METHODS
    // ========================================================================
    /**
     * Validate a public key
     */
    static validatePublicKey(key) {
        validatePublicKey(key);
    }
    /**
     * Validate a timestamp
     */
    static validateTimestamp(timestamp) {
        validateTimestamp(timestamp);
    }
    /**
     * Validate an amount
     */
    static validateAmount(amount) {
        validateAmount(amount);
    }
    /**
     * Create time lock PDA
     */
    static async findTimeLockPDA(owner, unlockTimestamp, programId) {
        return findTimeLockPDA(owner, unlockTimestamp, programId || PROGRAM_ID);
    }
    // ========================================================================
    // GETTERS
    // ========================================================================
    get connectionInstance() {
        return this.connection;
    }
    get walletInstance() {
        return this.wallet;
    }
    get programInstance() {
        return this.program;
    }
    get programId() {
        return this.program.programId;
    }
}
