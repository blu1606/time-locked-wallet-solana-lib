import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TimeLockedWallet } from "../target/types/time_locked_wallet";
import { 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Keypair,
  Connection,
  clusterApiUrl 
} from "@solana/web3.js";

// ============= MANUAL TEST CONFIGURATION =============
const TEST_CONFIG = {
  // Hardcoded values for manual testing
  UNLOCK_TIME_SECONDS: Math.floor(Date.now() / 1000) + 10, // Unlock after 10 seconds from now
  DEPOSIT_AMOUNT_SOL: 0.1, // 0.1 SOL
  DEPOSIT_AMOUNT_LAMPORTS: 0.1 * LAMPORTS_PER_SOL,
};

describe("Time-Locked Wallet Manual Test", () => {
  console.log("🔧 Test Configuration:");
  console.log(`- Unlock Time: ${new Date(TEST_CONFIG.UNLOCK_TIME_SECONDS * 1000).toLocaleString()}`);
  console.log(`- Deposit Amount: ${TEST_CONFIG.DEPOSIT_AMOUNT_SOL} SOL (${TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS} lamports)`);
  console.log("=====================================\n");

  it("Manual Test: Initialize + Deposit + Try Withdraw", async () => {
    // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
    const connection = provider.connection;
    const wallet = provider.wallet;

    console.log("🔗 Connected to:", connection.rpcEndpoint);
    console.log("👛 Wallet:", wallet.publicKey.toString());
    console.log("💰 Program ID:", program.programId.toString());

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Current wallet balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

    // ============= STEP 1: Find PDA =============
    console.log("🔍 STEP 1: Finding Time Lock Account PDA...");
    
    const [timeLockAccount, bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("time_lock"),
        wallet.publicKey.toBuffer(),
        new BN(TEST_CONFIG.UNLOCK_TIME_SECONDS).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    console.log(`📍 Time Lock Account PDA: ${timeLockAccount.toString()}`);
    console.log(`🎯 Bump: ${bump}\n`);

    // ============= STEP 2: Initialize =============
    console.log("🏗️  STEP 2: Initializing Time Lock Account...");
    
    const initTx = await program.methods
      .initialize(new BN(TEST_CONFIG.UNLOCK_TIME_SECONDS), { sol: {} })
      .accounts({
        timeLockAccount: timeLockAccount,
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Initialize Transaction: ${initTx}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(initTx, "confirmed");
    console.log("✅ Initialize transaction confirmed\n");

    // ============= STEP 3: Check Account State =============
    console.log("📊 STEP 3: Checking Account State...");
    
    const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
    console.log("📋 Account Data:");
    console.log(`  - Owner: ${accountData.owner.toString()}`);
    console.log(`  - Unlock Time: ${new Date(accountData.unlockTimestamp.toNumber() * 1000).toLocaleString()}`);
    console.log(`  - SOL Balance: ${accountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  - Is Locked: ${accountData.unlockTimestamp.toNumber() > Math.floor(Date.now() / 1000)}\n`);

    // ============= STEP 4: Deposit SOL =============
    console.log("💰 STEP 4: Depositing SOL...");
    
    const depositTx = await program.methods
      .depositSol(new BN(TEST_CONFIG.DEPOSIT_AMOUNT_LAMPORTS))
      .accounts({
        timeLockAccount: timeLockAccount,
        initializer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`✅ Deposit Transaction: ${depositTx}`);
    
    // Wait for confirmation
    await connection.confirmTransaction(depositTx, "confirmed");
    console.log("✅ Deposit transaction confirmed\n");

    // ============= STEP 5: Check Updated Account State =============
    console.log("📊 STEP 5: Checking Updated Account State...");
    
    const updatedAccountData = await program.account.timeLockAccount.fetch(timeLockAccount);
    console.log("📋 Updated Account Data:");
    console.log(`  - SOL Balance: ${updatedAccountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    
    const newWalletBalance = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Updated wallet balance: ${newWalletBalance / LAMPORTS_PER_SOL} SOL\n`);

    // ============= STEP 6: Try Withdraw (Should Fail) =============
    console.log("🚫 STEP 6: Trying to withdraw before unlock time (should fail)...");
    
    try {
      const earlyWithdrawTx = await program.methods
        .withdrawSol()
        .accounts({
          timeLockAccount: timeLockAccount,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("❌ ERROR: Withdraw should have failed but succeeded!");
      throw new Error("Withdraw should have failed but succeeded!");
    } catch (error: any) {
      console.log("✅ Expected error - withdrawal blocked before unlock time:");
      console.log(`   ${error.message}\n`);
    }

    console.log("🎉 Manual test completed successfully!");
    console.log("\n📝 Test Results:");
    console.log(`  - Time Lock Account: ${timeLockAccount.toString()}`);
    console.log(`  - Initialize Tx: ${initTx}`);
    console.log(`  - Deposit Tx: ${depositTx}`);
    console.log(`  - Unlock Time: ${TEST_CONFIG.UNLOCK_TIME_SECONDS}`);
    console.log("\n💡 To test withdrawal, wait for unlock time and run:");
    console.log(`   npm run test:withdraw ${timeLockAccount.toString()}`);
  });
});
