import { PublicKey, Transaction } from "@solana/web3.js";
import { AssetType, findTimeLockPDA, validateTimestamp, validateAmount, validatePublicKey } from "./types";
import { TimeLockBuilders } from "./builders";
/**
 * High-level instruction helpers for Time-Locked Wallet operations
 */
export class TimeLockInstructions {
    // Normalize various public key input shapes (string, PublicKey, adapter objects)
    normalizePublicKey(input) {
        try {
            console.log('normalizePublicKey debug - input:', input);
            console.log('normalizePublicKey debug - input type:', typeof input);
            console.log('normalizePublicKey debug - input constructor:', input?.constructor?.name);
            console.log('normalizePublicKey debug - input instanceof PublicKey:', input instanceof PublicKey);
            if (!input)
                throw new Error('empty');
            // Unwrap common adapter shapes
            if (input.publicKey)
                input = input.publicKey;
            if (input.pubkey)
                input = input.pubkey;
            // If it's already a PublicKey
            if (input instanceof PublicKey) {
                console.log('normalizePublicKey debug - returning existing PublicKey');
                return input;
            }
            // If it exposes a base58 getter
            if (input && typeof input.toBase58 === 'function') {
                console.log('normalizePublicKey debug - using toBase58()');
                return new PublicKey(input.toBase58());
            }
            // If it's a buffer-friendly object
            if (input && typeof input.toBuffer === 'function')
                return new PublicKey(input.toBuffer());
            // If it's a raw Uint8Array/Array of length 32
            if (input instanceof Uint8Array && input.length === 32)
                return new PublicKey(input);
            // If it's a string (base58)
            if (typeof input === 'string')
                return new PublicKey(input);
            // fallback: try toString()
            if (input && typeof input.toString === 'function')
                return new PublicKey(input.toString());
            return new PublicKey(input);
        }
        catch (e) {
            const preview = (() => {
                try {
                    if (typeof input === 'string')
                        return `${input.slice(0, 8)}...`;
                    if (input && typeof input.toBase58 === 'function')
                        return `${input.toBase58().slice(0, 8)}...`;
                    if (input && input.publicKey && typeof input.publicKey.toBase58 === 'function')
                        return `${input.publicKey.toBase58().slice(0, 8)}...`;
                    return String(input).slice(0, 32);
                }
                catch (_e) {
                    return '<unprintable>';
                }
            })();
            throw new Error(`invalid_public_key_input:${preview}`);
        }
    }
    constructor(program) {
        this.program = program;
        this.builders = new TimeLockBuilders(program);
    }
    // ========================================================================
    // SOL OPERATIONS
    // ========================================================================
    /**
     * Create a SOL time-locked wallet
     */
    async createSolTimeLock(params) {
        try {
            validateTimestamp(params.unlockTimestamp);
            params.owner = this.normalizePublicKey(params.owner);
            validatePublicKey(params.owner);
            const [timeLockAccount, bump] = await findTimeLockPDA(params.owner, params.unlockTimestamp, this.program.programId);
            let instructions = [];
            if (params.amount && params.amount > 0) {
                // Create and deposit in one transaction
                instructions = await this.builders.buildSolCreateAndDeposit(params);
            }
            else {
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
        }
        catch (error) {
            throw new Error(`Failed to create SOL time lock: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deposit SOL to existing time-locked wallet
     */
    async depositSol(params) {
        try {
            validateAmount(params.amount);
            params.timeLockAccount = this.normalizePublicKey(params.timeLockAccount);
            validatePublicKey(params.timeLockAccount);
            const instruction = await this.builders.buildSolDeposit(params);
            const transaction = new Transaction().add(instruction);
            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Sol,
                instructions: [instruction]
            };
        }
        catch (error) {
            throw new Error(`Failed to deposit SOL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Withdraw SOL from time-locked wallet
     */
    async withdrawSol(params) {
        try {
            // Normalize and validate each key separately to provide clearer errors
            try {
                console.log('withdrawSol debug - normalizing timeLockAccount:', params.timeLockAccount);
                params.timeLockAccount = this.normalizePublicKey(params.timeLockAccount);
                console.log('withdrawSol debug - normalized timeLockAccount:', params.timeLockAccount.toBase58());
            }
            catch (e) {
                console.error('withdrawSol debug - timeLockAccount normalization failed:', e);
                throw new Error('Invalid public key: timeLockAccount - ' + String(e));
            }
            try {
                console.log('withdrawSol debug - normalizing owner:', params.owner);
                params.owner = this.normalizePublicKey(params.owner);
                console.log('withdrawSol debug - normalized owner:', params.owner.toBase58());
            }
            catch (e) {
                console.error('withdrawSol debug - owner normalization failed:', e);
                throw new Error('Invalid public key: owner - ' + String(e));
            }
            try {
                console.log('withdrawSol debug - validating timeLockAccount');
                validatePublicKey(params.timeLockAccount);
                console.log('withdrawSol debug - timeLockAccount validation passed');
            }
            catch (e) {
                console.error('withdrawSol debug - timeLockAccount validation failed:', e);
                throw new Error('Invalid public key: timeLockAccount validation failed - ' + String(e));
            }
            try {
                console.log('withdrawSol debug - validating owner');
                validatePublicKey(params.owner);
                console.log('withdrawSol debug - owner validation passed');
            }
            catch (e) {
                console.error('withdrawSol debug - owner validation failed:', e);
                throw new Error('Invalid public key: owner validation failed - ' + String(e));
            }
            const instruction = await this.builders.buildSolWithdraw(params);
            const transaction = new Transaction().add(instruction);
            return {
                transaction,
                timeLockAccount: params.timeLockAccount,
                assetType: AssetType.Sol,
                instructions: [instruction]
            };
        }
        catch (error) {
            throw new Error(`Failed to withdraw SOL: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ========================================================================
    // TOKEN OPERATIONS
    // ========================================================================
    /**
     * Create a Token time-locked wallet
     */
    async createTokenTimeLock(params, depositParams) {
        try {
            validateTimestamp(params.unlockTimestamp);
            params.owner = this.normalizePublicKey(params.owner);
            validatePublicKey(params.owner);
            const [timeLockAccount, bump] = await findTimeLockPDA(params.owner, params.unlockTimestamp, this.program.programId);
            let instructions = [];
            if (depositParams && depositParams.amount && depositParams.amount > 0) {
                // Create and deposit in one transaction
                instructions = await this.builders.buildTokenCreateAndDeposit(params, depositParams);
            }
            else {
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
        }
        catch (error) {
            throw new Error(`Failed to create token time lock: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Deposit tokens to existing time-locked wallet
     */
    async depositToken(params) {
        try {
            validateAmount(params.amount);
            params.timeLockAccount = this.normalizePublicKey(params.timeLockAccount);
            params.tokenFromAta = this.normalizePublicKey(params.tokenFromAta);
            params.tokenVault = this.normalizePublicKey(params.tokenVault);
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
        }
        catch (error) {
            throw new Error(`Failed to deposit token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Withdraw tokens from time-locked wallet
     */
    async withdrawToken(params) {
        try {
            params.timeLockAccount = this.normalizePublicKey(params.timeLockAccount);
            params.owner = this.normalizePublicKey(params.owner);
            params.tokenFromVault = this.normalizePublicKey(params.tokenFromVault);
            params.tokenToAta = this.normalizePublicKey(params.tokenToAta);
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
        }
        catch (error) {
            throw new Error(`Failed to withdraw token: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ========================================================================
    // UTILITY METHODS
    // ========================================================================
    /**
     * Get time-locked wallet account data
     */
    async getTimeLockData(timeLockAccount) {
        try {
            // Note: In a real implementation, you would use the proper account type from your IDL
            // For now, we'll use the RPC connection directly
            const accountInfo = await this.program.provider.connection.getAccountInfo(timeLockAccount);
            if (!accountInfo) {
                throw new Error('Account not found');
            }
            // This would normally be deserialized using the proper account coder
            return accountInfo;
        }
        catch (error) {
            throw new Error(`Failed to fetch time lock data: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if time lock can be withdrawn (unlocked)
     */
    async canWithdraw(timeLockAccount) {
        try {
            // Try to fetch the account via Anchor program account fetch (gives decoded fields)
            // This requires the program account type to be available in the IDL.
            if (this.program && this.program.account && this.program.account.timeLockAccount) {
                const acc = await this.program.account.timeLockAccount.fetch(timeLockAccount);
                // support different field naming / BN types
                const unlockField = acc.unlockTimestamp ?? acc.unlock_timestamp ?? acc.unlock_timestamp?.toNumber?.call?.(acc.unlock_timestamp) ?? acc.unlockTimestamp?.toNumber?.call?.(acc.unlockTimestamp) ?? acc.unlock_timestamp;
                const unlockTs = typeof unlockField === 'number' ? unlockField : (unlockField && typeof unlockField.toNumber === 'function' ? unlockField.toNumber() : null);
                const slot = await this.program.provider.connection.getSlot();
                const chainTime = await this.program.provider.connection.getBlockTime(slot);
                const now = typeof chainTime === 'number' ? chainTime : Math.floor(Date.now() / 1000);
                if (unlockTs === null || unlockTs === undefined)
                    return false;
                return now >= unlockTs;
            }
            // fallback: try RPC account info and fail closed
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get remaining lock time in seconds
     */
    async getRemainingLockTime(timeLockAccount) {
        try {
            const accountInfo = await this.getTimeLockData(timeLockAccount);
            // In a real implementation, you would deserialize the account data to get the unlock timestamp
            // For now, we'll return 0 to indicate that this needs proper implementation
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
}
