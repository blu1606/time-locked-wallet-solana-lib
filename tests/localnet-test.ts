import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TimeLockedWallet } from "../target/types/time_locked_wallet";
import { 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair,
  Connection 
} from "@solana/web3.js";
import { expect } from "chai";

// ============= LOCALNET TEST CONFIGURATION =============
const TEST_CONFIG = {
  // Test configuration for localnet
  UNLOCK_TIME_SECONDS: Math.floor(Date.now() / 1000) + 30, // Unlock after 30 seconds from now
  DEPOSIT_AMOUNT_SOL: 0.1, // 0.1 SOL
  DEPOSIT_AMOUNT_LAMPORTS: 0.1 * LAMPORTS_PER_SOL,
  RPC_ENDPOINT: "http://127.0.0.1:8899", // Localnet
};

describe("Time-Locked Wallet Localnet Tests", () => {
  let provider: anchor.AnchorProvider;
  let program: Program<TimeLockedWallet>;
  let connection: Connection;
  let wallet: any;
  let timeLockAccount: PublicKey;
  let bump: number;

  before(async () => {
    console.log("🔧 Localnet Test Configuration:");
    console.log(`- RPC Endpoint: ${TEST_CONFIG.RPC_ENDPOINT}`);
    console.log(`- Unlock Time: ${new Date(TEST_CONFIG.UNLOCK_TIME_SECONDS * 1000).toLocaleString()}`);
    console.log(`- Deposit Amount: ${TEST_CONFIG.DEPOSIT_AMOUNT_SOL} SOL (${TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS} lamports)`);
    console.log("=====================================\n");

    // Configure the client to use the localnet cluster
    provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
    connection = provider.connection;
    wallet = provider.wallet;

    console.log("🔗 Connected to:", connection.rpcEndpoint);
    console.log("👛 Wallet:", wallet.publicKey.toString());
    console.log("💰 Program ID:", program.programId.toString());

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Current wallet balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

    // Ensure we have enough SOL for testing
    if (balance < TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS + 0.01 * LAMPORTS_PER_SOL) {
      throw new Error(`Insufficient balance. Need at least ${(TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS + 0.01 * LAMPORTS_PER_SOL) / LAMPORTS_PER_SOL} SOL`);
    }

    // Find PDA
    [timeLockAccount, bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("time_lock"),
        wallet.publicKey.toBuffer(),
        new BN(TEST_CONFIG.UNLOCK_TIME_SECONDS).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    console.log(`📍 Time Lock Account PDA: ${timeLockAccount.toString()}`);
    console.log(`🎯 Bump: ${bump}\n`);
  });

  it("Should initialize time lock account on localnet", async () => {
    console.log("🏗️  STEP 1: Initializing Time Lock Account...");
    
    const initTx = await program.methods
      .initialize(new BN(TEST_CONFIG.UNLOCK_TIME_SECONDS), { sol: {} })
      .accounts({
        timeLockAccount,                 // 👍 rõ ràng
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    console.log(`✅ Initialize Transaction: ${initTx}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(initTx, "confirmed");
    console.log("✅ Initialize transaction confirmed");

    // Verify account was created
    const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
    expect(accountData.owner.toString()).to.equal(wallet.publicKey.toString());
    expect(accountData.unlockTimestamp.toNumber()).to.equal(TEST_CONFIG.UNLOCK_TIME_SECONDS);
    expect(accountData.amount.toNumber()).to.equal(0);
    
    console.log("📋 Account Data:");
    console.log(`  - Owner: ${accountData.owner.toString()}`);
    console.log(`  - Unlock Time: ${new Date(accountData.unlockTimestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`  - SOL Balance: ${accountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  - Is Locked: ${accountData.unlockTimestamp.toNumber() > Math.floor(Date.now() / 1000)}\n`);
  });

  it("Should deposit SOL to time lock account on localnet", async () => {
    console.log("💰 STEP 2: Depositing SOL...");
    
    const depositTx = await program.methods
      .depositSol(new BN(TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS))
      .accounts({
        timeLockAccount,                 // ✅ thêm dòng này
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    console.log(`✅ Deposit Transaction: ${depositTx}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(depositTx, "confirmed");
    console.log("✅ Deposit transaction confirmed");

    // Verify deposit
    const updatedAccountData = await program.account.timeLockAccount.fetch(timeLockAccount);
    expect(updatedAccountData.amount.toNumber()).to.equal(TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS);
    
    console.log("📋 Updated Account Data:");
    console.log(`  - SOL Balance: ${updatedAccountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    
    const newWalletBalance = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Updated wallet balance: ${newWalletBalance / LAMPORTS_PER_SOL} SOL\n`);
  });

  it("Should fail to withdraw before unlock time on localnet", async () => {
    console.log("🚫 STEP 3: Trying to withdraw before unlock time (should fail)...");
    
    try {
      await program.methods
        .withdrawSol()
        .accounts({
          timeLockAccount,                 // ✅ thêm dòng này
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      
      throw new Error("Withdraw should have failed but succeeded!");
    } catch (error: any) {
      console.log("✅ Expected error - withdrawal blocked before unlock time:");
      console.log(`   ${error.message}`);
      
      // Check if it's the expected error
      expect(error.message).to.include("withdrawalTooEarly");
    }
  });

  it("Should get wallet info on localnet", async () => {
    console.log("📊 STEP 4: Getting wallet info...");
    
    const walletInfo = await program.methods
      .getWalletInfo()
      .accounts({
        timeLockAccount,                 // ✅ thêm dòng này
      })
      .view();

    console.log("📋 Wallet Info:");
    console.log(`  - Owner: ${walletInfo.owner.toString()}`);
    console.log(`  - Unlock Time: ${new Date(walletInfo.unlockTimestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`  - Amount: ${walletInfo.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  - Is Unlocked: ${walletInfo.isUnlocked}`);
    console.log(`  - Time Remaining: ${walletInfo.timeRemaining.toNumber()} seconds`);

    expect(walletInfo.owner.toString()).to.equal(wallet.publicKey.toString());
    expect(walletInfo.amount.toNumber()).to.equal(TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS);
    expect(walletInfo.isUnlocked).to.be.false;
    expect(walletInfo.timeRemaining.toNumber()).to.be.greaterThan(0);
  });

  after(() => {
    console.log("\n🎉 Localnet tests completed successfully!");
    console.log("\n📝 Test Results:");
    console.log(`  - Time Lock Account: ${timeLockAccount.toString()}`);
    console.log(`  - Unlock Time: ${TEST_CONFIG.UNLOCK_TIME_SECONDS}`);
    console.log(`  - Deposit Amount: ${TEST_CONFIG.DEPOSIT_AMOUNT_SOL} SOL`);
    console.log("\n💡 To test withdrawal after unlock time, run the withdrawal test or wait for unlock time");
  });
});
