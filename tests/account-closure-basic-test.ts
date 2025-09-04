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

// ============= PROGRAM IDS =============
const LOCALNET_PROGRAM_ID = new PublicKey("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g");

describe("Account Closure Basic Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  let program: Program<TimeLockedWallet>;
  const connection = provider.connection;

  let wallet: any;
  let timeLockAccount: PublicKey;
  let bump: number;

  before(async () => {
    // Try to load program from workspace first, then fallback to IDL
    try {
      program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
      console.log("✅ Loaded program from workspace");
    } catch (error) {
      console.log("⚠️  Workspace failed, loading IDL from file...");
      const idl = require("../target/idl/time_locked_wallet.json");
      program = new anchor.Program(idl, LOCALNET_PROGRAM_ID, provider) as Program<TimeLockedWallet>;
      console.log("✅ Loaded program from IDL file");
    }

    // Initialize wallet
    wallet = provider.wallet;
    console.log("👛 Wallet:", wallet.publicKey.toString());
    console.log("💰 Program ID:", program.programId.toString());
    
    // Airdrop SOL for testing
    try {
      await connection.requestAirdrop(wallet.publicKey, 5 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log("Airdrop failed, assuming sufficient balance");
    }
  });

  describe("SOL Account Withdrawal and Closure", () => {
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
    const depositAmount = 1 * LAMPORTS_PER_SOL;

    it("Should create, deposit, and close SOL account with rent reclaim", async () => {
      // 1. Find PDA for time-lock account
      [timeLockAccount, bump] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTimestamp).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      console.log("🔍 Creating time-lock account:", timeLockAccount.toString());
      
      // 2. Initialize time-lock account
      const initTx = await program.methods
        .initialize(new anchor.BN(unlockTimestamp), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Initialize transaction:", initTx);

      // 3. Deposit SOL to the account
      const depositTx = await program.methods
        .depositSol(new anchor.BN(depositAmount))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Deposit transaction:", depositTx);

      // 4. Verify account state before withdrawal
      const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
      expect(accountData.amount.toNumber()).to.equal(depositAmount);
      expect(accountData.owner.toString()).to.equal(wallet.publicKey.toString());

      // 5. Wait for unlock time
      console.log("⏳ Waiting for unlock time...");
      const waitTime = (unlockTimestamp - Math.floor(Date.now() / 1000) + 2) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // 6. Get balances before withdrawal and closure
      const accountInfoBefore = await connection.getAccountInfo(timeLockAccount);
      const walletBalanceBefore = await connection.getBalance(wallet.publicKey);
      const accountRent = accountInfoBefore?.lamports || 0;

      console.log("💰 Account rent:", accountRent);
      console.log("💰 Wallet balance before:", walletBalanceBefore);

      // 7. Withdraw all SOL and close account
      const withdrawAndCloseTx = await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Withdraw and close transaction:", withdrawAndCloseTx);

      // 8. Verify account is closed
      const accountInfoAfter = await connection.getAccountInfo(timeLockAccount);
      expect(accountInfoAfter).to.be.null;

      // 9. Verify wallet received SOL + rent
      const walletBalanceAfter = await connection.getBalance(wallet.publicKey);
      const expectedIncrease = depositAmount + accountRent;
      
      console.log("💰 Wallet balance after:", walletBalanceAfter);
      console.log("💰 Expected increase:", expectedIncrease);
      
      // Allow for transaction fees
      expect(walletBalanceAfter).to.be.greaterThan(walletBalanceBefore + expectedIncrease - 10000);
    });

    it("Should close empty account and reclaim rent", async () => {
      const emptyUnlockTime = Math.floor(Date.now() / 1000) + 30;
      
      // 1. Create empty time-lock account
      const [emptyTimeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(emptyUnlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // 2. Initialize without deposit
      await program.methods
        .initialize(new anchor.BN(emptyUnlockTime), { sol: {} })
        .accounts({
          timeLockAccount: emptyTimeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Get rent amount before closure
      const accountInfo = await connection.getAccountInfo(emptyTimeLockAccount);
      const rentAmount = accountInfo?.lamports || 0;
      const walletBalanceBefore = await connection.getBalance(wallet.publicKey);

      // 5. Close empty account
      const closeTx = await program.methods
        .closeEmptyAccount()
        .accounts({
          timeLockAccount: emptyTimeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Close empty account transaction:", closeTx);

      // 6. Verify account is closed and rent returned
      const accountInfoAfter = await connection.getAccountInfo(emptyTimeLockAccount);
      expect(accountInfoAfter).to.be.null;

      const walletBalanceAfter = await connection.getBalance(wallet.publicKey);
      expect(walletBalanceAfter).to.be.greaterThan(walletBalanceBefore + rentAmount - 10000);
    });

    it("Should reject closing non-empty account with closeEmpty", async () => {
      const nonEmptyUnlockTime = Math.floor(Date.now() / 1000) + 30;
      
      // 1. Create account with funds
      const [nonEmptyAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(nonEmptyUnlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(nonEmptyUnlockTime), { sol: {} })
        .accounts({
          timeLockAccount: nonEmptyAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 2. Deposit funds
      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
        .accounts({
          timeLockAccount: nonEmptyAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 3. Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 35000));

      // 4. Attempt to close non-empty account (should fail)
      try {
        await program.methods
          .closeEmptyAccount()
          .accounts({
            timeLockAccount: nonEmptyAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error for non-empty account");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotEmpty");
      }

      // 5. Clean up: properly withdraw and close
      await program.methods
        .withdrawAndCloseSol()
        .accounts({
          timeLockAccount: nonEmptyAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Should reject withdrawal before unlock time", async () => {
      const futureUnlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // 1. Create account with future unlock time
      const [futureAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(futureUnlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .initialize(new anchor.BN(futureUnlockTime), { sol: {} })
        .accounts({
          timeLockAccount: futureAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
        .accounts({
          timeLockAccount: futureAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // 2. Attempt withdrawal before unlock time (should fail)
      try {
        await program.methods
          .withdrawSol()
          .accounts({
            timeLockAccount: futureAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error for premature withdrawal");
      } catch (error) {
        expect(error.toString()).to.include("TimeLockNotExpired");
      }
    });
  });
});
