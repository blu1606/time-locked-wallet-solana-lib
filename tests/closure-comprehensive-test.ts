import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TimeLockedWallet } from "../target/types/time_locked_wallet";
import {
  PublicKey,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";

describe("Closure Comprehensive Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
  const connection = provider.connection;

  let wallet: any;

  before(async () => {
    wallet = provider.wallet;
    
    // Airdrop SOL for testing
    try {
      await connection.requestAirdrop(wallet.publicKey, 10 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Airdrop failed, assuming sufficient balance");
    }
  });

  describe("SOL Account Closure Scenarios", () => {
    it("Should handle partial withdrawal then closure", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      const totalDeposit = 2 * LAMPORTS_PER_SOL;
      const partialWithdraw = LAMPORTS_PER_SOL;

      // 1. Create and fund account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(totalDeposit))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 2. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 3. Partial withdrawal
      await program.methods
        .withdrawSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 4. Verify partial balance
      const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
      expect(accountData.amount.toNumber()).to.equal(totalDeposit - partialWithdraw);

      // 5. Close remaining account
      const balanceBefore = await connection.getBalance(wallet.publicKey);
      
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 6. Verify account closure and balance increase
      const accountInfo = await connection.getAccountInfo(timeLockAccount);
      expect(accountInfo).to.be.null;

      const balanceAfter = await connection.getBalance(wallet.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should handle multiple deposits then closure", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      const deposits = [0.5, 0.3, 0.2]; // SOL amounts

      // 1. Create account
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 2. Multiple deposits
      for (const amount of deposits) {
        await program.methods
          .depositSol(new anchor.BN(amount * LAMPORTS_PER_SOL))
          .accounts({
            timeLockAccount,
            depositor: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Verify total balance
      const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
      const expectedTotal = deposits.reduce((sum, amount) => sum + amount, 0) * LAMPORTS_PER_SOL;
      expect(accountData.amount.toNumber()).to.equal(expectedTotal);

      // 5. Withdraw and close
      const balanceBefore = await connection.getBalance(wallet.publicKey);
      
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 6. Verify closure
      const accountInfo = await connection.getAccountInfo(timeLockAccount);
      expect(accountInfo).to.be.null;

      const balanceAfter = await connection.getBalance(wallet.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore + expectedTotal - 50000); // Allow for fees
    });

    it("Should reject withdrawal and closure before unlock time", async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour future
      
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(futureTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(futureTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Attempt withdrawal and closure before unlock (should fail)
      try {
        await program.methods
          .withdrawAndCloseSol()
          .accounts({
            timeLockAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have rejected early withdrawal and closure");
      } catch (error) {
        expect(error.toString()).to.include("TimeLockNotExpired");
      }
    });
  });

  describe("Empty Account Closure Scenarios", () => {
    it("Should close multiple empty accounts sequentially", async () => {
      const accounts = [];
      const unlockTime = Math.floor(Date.now() / 1000) + 30;

      // 1. Create multiple empty accounts
      for (let i = 0; i < 3; i++) {
        const timestamp = unlockTime + i; // Slightly different timestamps
        const [timeLockAccount] = await PublicKey.findProgramAddress(
          [
            Buffer.from("time_lock"),
            wallet.publicKey.toBuffer(),
            new anchor.BN(timestamp).toArrayLike(Buffer, "le", 8),
          ],
          program.programId
        );

        await program.methods
          .initialize(new anchor.BN(timestamp), { sol: {} })
          .accounts({
            timeLockAccount,
            initializer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        accounts.push({ account: timeLockAccount, timestamp });
      }

      // 2. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 3. Close all empty accounts
      const balanceBefore = await connection.getBalance(wallet.publicKey);

      for (const { account } of accounts) {
        await program.methods
          .closeEmptyAccount()
          .accounts({
            timeLockAccount: account,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        // Verify each account is closed
        const accountInfo = await connection.getAccountInfo(account);
        expect(accountInfo).to.be.null;
      }

      // 4. Verify total rent reclaimed
      const balanceAfter = await connection.getBalance(wallet.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should reject closing account that has received deposits", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // 1. Initialize account
      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 2. Deposit small amount
      await program.methods
        .depositSol(new anchor.BN(1000)) // Very small amount
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Attempt to close as empty (should fail)
      try {
        await program.methods
          .closeEmptyAccount()
          .accounts({
            timeLockAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have rejected closing non-empty account");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotEmpty");
      }

      // 5. Clean up properly
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });
  });

  describe("Rent Reclaim Validation", () => {
    it("Should reclaim exactly the right amount of rent", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // 1. Initialize account and measure rent
      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const accountInfo = await connection.getAccountInfo(timeLockAccount);
      const rentAmount = accountInfo?.lamports || 0;
      expect(rentAmount).to.be.greaterThan(0);

      console.log("📊 Account rent amount:", rentAmount);

      // 2. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 3. Record balance and close
      const balanceBefore = await connection.getBalance(wallet.publicKey);

      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 4. Verify exact rent reclaim (allowing for transaction fees)
      const balanceAfter = await connection.getBalance(wallet.publicKey);
      const actualIncrease = balanceAfter - balanceBefore;
      
      console.log("📊 Balance increase:", actualIncrease);
      console.log("📊 Expected rent:", rentAmount);

      // Should reclaim rent minus transaction fees
      expect(actualIncrease).to.be.greaterThan(rentAmount - 10000);
      expect(actualIncrease).to.be.lessThan(rentAmount + 1000);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("Should handle account closure exactly at unlock time", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 5; // Very short lock
      
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Wait until exactly unlock time
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Should succeed at or after unlock time
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const accountInfo = await connection.getAccountInfo(timeLockAccount);
      expect(accountInfo).to.be.null;
    });

    it("Should prevent double closure attempts", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      
      const [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 35000));

      // First closure should succeed
      await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Second closure attempt should fail
      try {
        await program.methods
          .closeEmptyAccount()
          .accounts({
            timeLockAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have failed on double closure attempt");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });
  });
});
