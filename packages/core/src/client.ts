import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TimeLockedWallet } from "../target/types/time_locked_wallet"; // Auto-generated IDL
import { IDL } from "../target/types/time_locked_wallet";

export class TimeLockClient {
    private provider: anchor.Provider;
    private program: anchor.Program<TimeLockedWallet>;

    constructor(provider: anchor.Provider, programId: PublicKey) {
        this.provider = provider;
        this.program = new anchor.Program(IDL, programId, provider);
    }

    /**
     * Finds the PDA for a time-locked wallet account.
     * @param owner The public key of the account owner.
     * @param unlockTimestamp The unlock timestamp.
     * @returns A promise resolving to an array containing the PDA and its bump seed.
     */
    public async findTimeLockAccount(owner: PublicKey, unlockTimestamp: number): Promise<[PublicKey, number]> {
        return PublicKey.findProgramAddress(
            [
                anchor.utils.bytes.utf8.encode("time_lock"),
                owner.toBuffer(),
                new anchor.BN(unlockTimestamp).toArrayLike(Buffer, "le", 8),
            ],
            this.program.programId
        );
    }

    /**
     * Creates a new time-locked wallet.
     * @param owner The public key of the account owner.
     * @param unlockTimestamp The timestamp when the funds can be unlocked.
     * @returns A promise resolving to the transaction signature.
     */
    public async initializeTimeLock(
        owner: PublicKey,
        unlockTimestamp: number
    ): Promise<string> {
        const [timeLockAccount, bump] = await this.findTimeLockAccount(owner, unlockTimestamp);

        const tx = await this.program.methods
            .initialize(new anchor.BN(unlockTimestamp), bump)
            .accounts({
                timeLockAccount: timeLockAccount,
                initializer: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        return tx;
    }

    /**
     * Deposits SOL into the time-locked wallet.
     * @param timeLockAccount The PDA of the time-locked wallet.
     * @param amount The amount of SOL to deposit in lamports.
     * @returns A promise resolving to the transaction signature.
     */
    public async depositSol(
        timeLockAccount: PublicKey,
        amount: number
    ): Promise<string> {
        const tx = await this.program.methods
            .depositSol(new anchor.BN(amount))
            .accounts({
                timeLockAccount: timeLockAccount,
                initializer: this.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        return tx;
    }

    /**
     * Deposits SPL Tokens into the time-locked wallet's token vault.
     * @param timeLockAccount The PDA of the time-locked wallet.
     * @param tokenFromAta The owner's associated token account.
     * @param tokenVault The program's token vault account.
     * @param amount The amount of tokens to deposit.
     * @param tokenProgramId The token program ID.
     * @returns A promise resolving to the transaction signature.
     */
    public async depositToken(
        timeLockAccount: PublicKey,
        tokenFromAta: PublicKey,
        tokenVault: PublicKey,
        amount: number,
        tokenProgramId: PublicKey
    ): Promise<string> {
        const tx = await this.program.methods
            .depositToken(new anchor.BN(amount))
            .accounts({
                timeLockAccount: timeLockAccount,
                initializer: this.provider.wallet.publicKey,
                tokenFromAta: tokenFromAta,
                tokenVault: tokenVault,
                tokenProgram: tokenProgramId,
            })
            .rpc();
        return tx;
    }

    /**
     * Withdraws SOL from the time-locked wallet.
     * @param timeLockAccount The PDA of the time-locked wallet.
     * @param owner The public key of the account owner.
     * @returns A promise resolving to the transaction signature.
     */
    public async withdrawSol(
        timeLockAccount: PublicKey,
        owner: PublicKey
    ): Promise<string> {
        const tx = await this.program.methods
            .withdrawSol()
            .accounts({
                timeLockAccount: timeLockAccount,
                owner: owner,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        return tx;
    }

    /**
     * Withdraws SPL Tokens from the time-locked wallet's token vault.
     * @param timeLockAccount The PDA of the time-locked wallet.
     * @param owner The public key of the account owner.
     * @param tokenFromVault The program's token vault account.
     * @param tokenToAta The owner's associated token account.
     * @param tokenProgramId The token program ID.
     * @returns A promise resolving to the transaction signature.
     */
    public async withdrawToken(
        timeLockAccount: PublicKey,
        owner: PublicKey,
        tokenFromVault: PublicKey,
        tokenToAta: PublicKey,
        tokenProgramId: PublicKey
    ): Promise<string> {
        const tx = await this.program.methods
            .withdrawToken()
            .accounts({
                timeLockAccount: timeLockAccount,
                owner: owner,
                tokenFromVault: tokenFromVault,
                tokenToAta: tokenToAta,
                tokenProgram: tokenProgramId,
            })
            .rpc();
        return tx;
    }
}