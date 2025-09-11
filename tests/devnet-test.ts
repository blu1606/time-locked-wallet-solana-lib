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
import { expect } from "chai";
import { BN } from "bn.js";
import * as fs from "fs";

// Devnet Program ID (deployed)
const DEVNET_PROGRAM_ID = new PublicKey("8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx");

describe("Devnet Demo Test", function() {
  this.timeout(90000); // Increased timeout for withdrawal tests
  
  let provider: AnchorProvider;
  let program: any;
  let mainWallet: Keypair;

  before(async function() {
    console.log("\n🌐 DEVNET Demo Test");
    
    // Setup connection
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Load main wallet
    mainWallet = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(
        fs.readFileSync('/home/man-tra-laptop/.config/solana/id.json', 'utf8')
      ))
    );
    
    const wallet = new Wallet(mainWallet);
    provider = new AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    
    // Load program
    program = anchor.workspace.TimeLockedWallet;
    console.log("✅ Program loaded:", program.programId.toString());
    
    // Check wallet balance
    const balance = await provider.connection.getBalance(mainWallet.publicKey);
    console.log("💰 Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      console.log("⚠️ Insufficient balance for full testing");
    }
  });

  it("Should verify program exists and create time-lock account", async function() {
    console.log("🧪 Creating time-lock demo...");
    
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 10; // 10 seconds
    console.log("⏰ Unlock in 10 seconds");
    
    const [timeLockAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("time_lock"),
        mainWallet.publicKey.toBuffer(),
        new BN(unlockTimestamp).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    console.log("📍 Time lock account:", timeLockAccount.toString());
    
    try {
      // Initialize
      const initIx = await program.methods
        .initialize(new BN(unlockTimestamp), { sol: {} })
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const tx = new Transaction().add(initIx);
      const signature = await provider.sendAndConfirm(tx);
      
      console.log("✅ Initialize successful:", signature);
      
      // Verify account exists
      const accountInfo = await provider.connection.getAccountInfo(timeLockAccount);
      expect(accountInfo).to.not.be.null;
      console.log("✅ Account created with data length:", accountInfo!.data.length);
      
    } catch (error) {
      console.log("❌ Test failed:", error);
      throw error;
    }
  });

  it("Should deposit small amount of SOL", async function() {
    console.log("💰 Testing SOL deposit...");
    
    const balance = await provider.connection.getBalance(mainWallet.publicKey);
    if (balance < 0.02 * LAMPORTS_PER_SOL) {
      console.log("⚠️ Skipping deposit test - insufficient balance");
      return;
    }
    
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 5;
    const [timeLockAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("time_lock"),
        mainWallet.publicKey.toBuffer(),
        new BN(unlockTimestamp).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      // Initialize first
      const initIx = await program.methods
        .initialize(new BN(unlockTimestamp), { sol: {} })
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      // Deposit
      const depositAmount = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL
      const depositIx = await program.methods
        .depositSol(new BN(depositAmount))
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const tx = new Transaction().add(initIx, depositIx);
      const signature = await provider.sendAndConfirm(tx);
      
      console.log("✅ Deposit successful:", signature);
      console.log("💸 Deposited:", depositAmount / LAMPORTS_PER_SOL, "SOL");
      
      const accountBalance = await provider.connection.getBalance(timeLockAccount);
      console.log("🏦 Account balance:", accountBalance / LAMPORTS_PER_SOL, "SOL");
      
      expect(accountBalance).to.be.greaterThan(depositAmount);
      
    } catch (error) {
      console.log("❌ Deposit test failed:", error);
      throw error;
    }
  });

  it("Should reject early withdrawal (time-lock mechanism)", async function() {
    console.log("🚫 Testing early withdrawal rejection...");
    
    const balance = await provider.connection.getBalance(mainWallet.publicKey);
    if (balance < 0.02 * LAMPORTS_PER_SOL) {
      console.log("⚠️ Skipping early withdrawal test - insufficient balance");
      return;
    }
    
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 10; // 10 seconds in future
    const [timeLockAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("time_lock"),
        mainWallet.publicKey.toBuffer(),
        new BN(unlockTimestamp).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      // Initialize and deposit first
      const initIx = await program.methods
        .initialize(new BN(unlockTimestamp), { sol: {} })
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const depositAmount = 0.001 * LAMPORTS_PER_SOL;
      const depositIx = await program.methods
        .depositSol(new BN(depositAmount))
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const setupTx = new Transaction().add(initIx, depositIx);
      await provider.sendAndConfirm(setupTx);
      console.log("✅ Setup complete, now testing early withdrawal...");
      
      // Try to withdraw before unlock time (should fail)
      const withdrawIx = await program.methods
        .withdrawSol()
        .accountsPartial({
          timeLockAccount,
          owner: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const withdrawTx = new Transaction().add(withdrawIx);
      
      try {
        await provider.sendAndConfirm(withdrawTx);
        throw new Error("Withdrawal should have failed but succeeded");
      } catch (error: any) {
        if (error.message?.includes("should have failed")) {
          throw error;
        }
        console.log("✅ Early withdrawal correctly rejected");
        console.log("🔒 Time-lock mechanism working properly");
        // Verify it's the correct error (time lock not expired)
        expect(error.logs || error.transactionLogs || []).to.satisfy((logs: string[]) => 
          logs.some(log => log.includes("TIME_LOCK_NOT_EXPIRED") || log.includes("time") || log.includes("lock"))
        );
      }
      
    } catch (error) {
      console.log("❌ Early withdrawal test failed:", error);
      throw error;
    }
  });

  it("Should allow withdrawal after unlock time", async function() {
    console.log("⏰ Testing withdrawal after unlock...");
    
    const balance = await provider.connection.getBalance(mainWallet.publicKey);
    if (balance < 0.02 * LAMPORTS_PER_SOL) {
      console.log("⚠️ Skipping withdrawal test - insufficient balance");
      return;
    }
    
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 3; // 3 seconds (short for demo)
    const [timeLockAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("time_lock"),
        mainWallet.publicKey.toBuffer(),
        new BN(unlockTimestamp).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    
    try {
      // Initialize and deposit first
      const initIx = await program.methods
        .initialize(new BN(unlockTimestamp), { sol: {} })
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const depositAmount = 0.001 * LAMPORTS_PER_SOL;
      const depositIx = await program.methods
        .depositSol(new BN(depositAmount))
        .accountsPartial({
          timeLockAccount,
          initializer: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const setupTx = new Transaction().add(initIx, depositIx);
      await provider.sendAndConfirm(setupTx);
      console.log("✅ Setup complete, waiting for unlock...");
      
      // Wait for unlock time
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime < unlockTimestamp) {
        const waitTime = (unlockTimestamp - currentTime + 2) * 1000;
        console.log(`⏳ Waiting ${waitTime/1000} seconds for unlock...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      console.log("🔓 Time lock expired, attempting withdrawal...");
      
      // Check initial balance
      const initialBalance = await provider.connection.getBalance(mainWallet.publicKey);
      
      // Now withdraw after unlock time (should succeed)
      const withdrawIx = await program.methods
        .withdrawSol()
        .accountsPartial({
          timeLockAccount,
          owner: mainWallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const withdrawTx = new Transaction().add(withdrawIx);
      const signature = await provider.sendAndConfirm(withdrawTx);
      
      console.log("✅ Withdrawal successful:", signature);
      
      // Verify balance increased
      const finalBalance = await provider.connection.getBalance(mainWallet.publicKey);
      expect(finalBalance).to.be.greaterThan(initialBalance);
      console.log("💰 Funds successfully withdrawn after unlock");
      console.log("📈 Balance increased by:", (finalBalance - initialBalance) / LAMPORTS_PER_SOL, "SOL");
      
    } catch (error) {
      console.log("❌ Withdrawal after unlock test failed:", error);
      throw error;
    }
  });
});
