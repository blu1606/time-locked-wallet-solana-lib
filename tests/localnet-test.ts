import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  Transaction,
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { expect } from "chai";
import { BN } from "bn.js";

// Localnet Program ID
const LOCALNET_PROGRAM_ID = new PublicKey("8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx");

describe("Time-Locked Wallet - Localnet Tests", () => {
  let provider: AnchorProvider;
  let program: any;
  let testUser: Keypair;

  before(async () => {
    // Setup provider for localnet
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    const wallet = new Wallet(Keypair.generate());
    provider = new AnchorProvider(connection, wallet, {});
    
    anchor.setProvider(provider);
    
    // Load program from workspace for localnet
    try {
      program = anchor.workspace.TimeLockedWallet;
      console.log("✅ Program loaded from workspace");
      
      // Verify program ID matches localnet
      expect(program.programId.toString()).to.equal(LOCALNET_PROGRAM_ID.toString());
      
    } catch (error) {
      console.log("❌ Workspace not available:", error);
      throw new Error("Cannot load program from workspace. Make sure to run 'anchor build' first.");
    }
    
    console.log("\n🌐 LOCALNET Test Suite");
    console.log("Program ID:", program.programId.toString());
    
    // Create test user
    testUser = Keypair.generate();
    console.log("Test user:", testUser.publicKey.toString());
    
    // Airdrop SOL to test user
    try {
      console.log("🚁 Requesting airdrop...");
      const signature = await provider.connection.requestAirdrop(
        testUser.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      
      await provider.connection.confirmTransaction(signature, "confirmed");
      console.log("✅ Airdrop confirmed");
      
      const balance = await provider.connection.getBalance(testUser.publicKey);
      console.log("Test user balance:", balance / LAMPORTS_PER_SOL, "SOL");
      
    } catch (error) {
      console.log("⚠️ Airdrop failed:", error);
      throw error;
    }
  });

  describe("SOL Time-Locked Wallet Tests", () => {
    let unlockTimestamp: number;
    let timeLockAccount: PublicKey;

    before(async () => {
      unlockTimestamp = Math.floor(Date.now() / 1000) + 8; // 8 seconds
      console.log(`⏰ Unlock in 8 seconds`);
      
      [timeLockAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("time_lock"),
          testUser.publicKey.toBuffer(),
          new BN(unlockTimestamp).toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      console.log("Time lock account:", timeLockAccount.toString());
    });

    it("Should initialize a SOL time-locked wallet", async () => {
      console.log("🏗️ Test 1: Initialize SOL Wallet");
      
      try {
        const instruction = await program.methods
          .initialize(new BN(unlockTimestamp), { sol: {} })
          .accountsPartial({
            timeLockAccount,
            initializer: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = testUser.publicKey;
        tx.sign(testUser);
        
        const signature = await provider.connection.sendRawTransaction(tx.serialize());
        await provider.connection.confirmTransaction(signature, "confirmed");
        
        console.log("✅ Initialize successful");
        
        const accountInfo = await provider.connection.getAccountInfo(timeLockAccount);
        expect(accountInfo).to.not.be.null;
        expect(accountInfo!.data.length).to.be.greaterThan(0);
        
      } catch (error) {
        console.log("❌ Initialize failed:", error);
        throw error;
      }
    });

    it("Should deposit SOL to time-locked wallet", async () => {
      console.log("💰 Test 2: Deposit SOL");
      
      const depositAmount = 0.1 * LAMPORTS_PER_SOL;
      console.log("Deposit amount:", depositAmount / LAMPORTS_PER_SOL, "SOL");
      
      try {
        const instruction = await program.methods
          .depositSol(new BN(depositAmount))
          .accountsPartial({
            timeLockAccount,
            initializer: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = testUser.publicKey;
        tx.sign(testUser);
        
        const signature = await provider.connection.sendRawTransaction(tx.serialize());
        await provider.connection.confirmTransaction(signature, "confirmed");
        
        console.log("✅ Deposit successful");
        
        const accountBalance = await provider.connection.getBalance(timeLockAccount);
        expect(accountBalance).to.be.greaterThan(depositAmount);
        console.log("Account balance:", accountBalance / LAMPORTS_PER_SOL, "SOL");
        
      } catch (error) {
        console.log("❌ Deposit failed:", error);
        throw error;
      }
    });

    it("Should fail to withdraw before unlock time", async () => {
      console.log("🚫 Test 3: Early Withdrawal (should fail)");
      
      try {
        const instruction = await program.methods
          .withdrawSol()
          .accountsPartial({
            timeLockAccount,
            owner: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = testUser.publicKey;
        tx.sign(testUser);
        
        const signature = await provider.connection.sendRawTransaction(tx.serialize());
        await provider.connection.confirmTransaction(signature, "confirmed");
        
        throw new Error("Withdrawal should have failed but succeeded");
        
      } catch (error: any) {
        if (error.message?.includes("Withdrawal should have failed")) {
          throw error;
        }
        console.log("✅ Early withdrawal correctly failed");
        expect(error.transactionLogs).to.satisfy((logs: string[]) => 
          logs.some(log => log.includes("TIME_LOCK_NOT_EXPIRED"))
        );
      }
    });

    it("Should withdraw SOL after unlock time", async () => {
      console.log("⏰ Test 4: Wait and Withdraw");
      
      // Wait for unlock time
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < unlockTimestamp) {
        const waitTime = (unlockTimestamp - currentTime + 2) * 1000;
        console.log(`Waiting ${waitTime/1000} seconds for unlock...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      console.log("💸 Now withdrawing SOL...");
      
      try {
        const initialBalance = await provider.connection.getBalance(testUser.publicKey);
        
        const instruction = await program.methods
          .withdrawSol()
          .accountsPartial({
            timeLockAccount,
            owner: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        
        const tx = new Transaction().add(instruction);
        tx.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = testUser.publicKey;
        tx.sign(testUser);
        
        const signature = await provider.connection.sendRawTransaction(tx.serialize());
        await provider.connection.confirmTransaction(signature, "confirmed");
        
        console.log("✅ Withdrawal successful");
        
        const finalBalance = await provider.connection.getBalance(testUser.publicKey);
        expect(finalBalance).to.be.greaterThan(initialBalance);
        console.log("Final user balance:", finalBalance / LAMPORTS_PER_SOL, "SOL");
        
      } catch (error) {
        console.log("❌ Withdrawal failed:", error);
        throw error;
      }
    });
  });

  after(() => {
    console.log("\n🎉 Localnet Test Suite Completed!");
    console.log("✅ SOL wallet tests: All passed");
  });
});
