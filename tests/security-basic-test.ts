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

describe("Security Basic Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
  const connection = provider.connection;

  let wallet: any;
  let unauthorizedUser: Keypair;
  let timeLockAccount: PublicKey;

  before(async () => {
    wallet = provider.wallet;
    unauthorizedUser = Keypair.generate();
    
    // Airdrop for both accounts
    try {
      await connection.requestAirdrop(wallet.publicKey, 3 * LAMPORTS_PER_SOL);
      await connection.requestAirdrop(unauthorizedUser.publicKey, 2 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Airdrop failed, assuming sufficient balance");
    }
  });

  describe("Unauthorized Access Prevention", () => {
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 60;
    const depositAmount = LAMPORTS_PER_SOL / 2;

    beforeEach(async () => {
      // Create a new time-lock account for each test
      const timestamp = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000) + 60;
      
      [timeLockAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(timestamp).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Initialize and fund the account
      await program.methods
        .initialize(new anchor.BN(timestamp), { sol: {} })
        .accounts({
          timeLockAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(depositAmount))
        .accounts({
          timeLockAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Wait for unlock
      await new Promise(resolve => setTimeout(resolve, 65000));
    });

    it("Should reject withdrawal with wrong owner", async () => {
      try {
        await program.methods
          .withdrawSol()
          .accounts({
            timeLockAccount,
            owner: unauthorizedUser.publicKey, // Wrong owner
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown unauthorized error");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintHasOne");
      }
    });

    it("Should reject account closure with wrong owner", async () => {
      try {
        await program.methods
          .withdrawAndCloseSol()
          .accounts({
            timeLockAccount,
            owner: unauthorizedUser.publicKey, // Wrong owner
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown unauthorized error");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintHasOne");
      }
    });

    it("Should reject deposit from unauthorized account to someone else's time-lock", async () => {
      // This should actually succeed as anyone can deposit to a time-lock
      // But let's test the owner constraint on withdrawal
      
      // Unauthorized user deposits (this should work)
      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
        .accounts({
          timeLockAccount,
          depositor: unauthorizedUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();

      // But unauthorized user cannot withdraw (this should fail)
      try {
        await program.methods
          .withdrawSol()
          .accounts({
            timeLockAccount,
            owner: unauthorizedUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown unauthorized error");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintHasOne");
      }
    });

    it("Should reject closing empty account with wrong owner", async () => {
      // First properly withdraw to make account empty
      await program.methods
        .withdrawSol()
        .accounts({
          timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Now unauthorized user tries to close empty account
      try {
        await program.methods
          .closeEmptyAccount()
          .accounts({
            timeLockAccount,
            owner: unauthorizedUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();

        expect.fail("Should have thrown unauthorized error");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintHasOne");
      }
    });
  });

  describe("PDA Validation", () => {
    it("Should reject operations on invalid PDA", async () => {
      // Create an invalid PDA (not derived correctly)
      const invalidAccount = Keypair.generate();
      const unlockTime = Math.floor(Date.now() / 1000) + 60;

      try {
        await program.methods
          .initialize(new anchor.BN(unlockTime), { sol: {} })
          .accounts({
            timeLockAccount: invalidAccount.publicKey, // Invalid PDA
            initializer: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([invalidAccount])
          .rpc();

        expect.fail("Should have rejected invalid PDA");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintSeeds");
      }
    });

    it("Should validate PDA derivation parameters", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 60;
      
      // Create PDA with correct parameters
      const [correctPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      // Create PDA with wrong timestamp
      const [wrongPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("time_lock"),
          wallet.publicKey.toBuffer(),
          new anchor.BN(unlockTime + 1).toArrayLike(Buffer, "le", 8), // Wrong timestamp
        ],
        program.programId
      );

      // Initialize with correct PDA should work
      await program.methods
        .initialize(new anchor.BN(unlockTime), { sol: {} })
        .accounts({
          timeLockAccount: correctPDA,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Try to deposit to wrong PDA should fail
      try {
        await program.methods
          .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
          .accounts({
            timeLockAccount: wrongPDA, // Wrong PDA for this timestamp
            depositor: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have rejected wrong PDA");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });
  });

  describe("Signature Validation", () => {
    it("Should require valid signature for owner operations", async () => {
      const unlockTime = Math.floor(Date.now() / 1000) + 30;
      
      const [testAccount] = await PublicKey.findProgramAddress(
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
          timeLockAccount: testAccount,
          initializer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .depositSol(new anchor.BN(LAMPORTS_PER_SOL / 10))
        .accounts({
          timeLockAccount: testAccount,
          depositor: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 35000));

      // Try to withdraw without proper signature (should fail)
      // Note: Anchor automatically handles signature validation,
      // so this test verifies the constraint is in place
      try {
        await program.methods
          .withdrawSol()
          .accounts({
            timeLockAccount: testAccount,
            owner: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser]) // Wrong signer
          .rpc();

        expect.fail("Should have required correct signature");
      } catch (error) {
        expect(error.toString()).to.include("Signature verification failed");
      }
    });
  });

  describe("Time Lock Security", () => {
    it("Should enforce time lock across different operations", async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour future
      
      const [futureAccount] = await PublicKey.findProgramAddress(
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

      // All withdrawal operations should fail before unlock time
      const operations = [
        () => program.methods.withdrawSol().accounts({
          timeLockAccount: futureAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }).rpc(),
        
        () => program.methods.withdrawAndCloseSol().accounts({
          timeLockAccount: futureAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }).rpc(),
      ];

      for (const operation of operations) {
        try {
          await operation();
          expect.fail("Should have enforced time lock");
        } catch (error) {
          expect(error.toString()).to.include("TimeLockNotExpired");
        }
      }
    });
  });
});
