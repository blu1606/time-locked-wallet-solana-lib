import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TimeLockedWallet } from "../target/types/time_locked_wallet";
import { 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl 
} from "@solana/web3.js";

/**
 * Standalone withdrawal test script
 * Usage: npm run test:withdraw <timeLockAccountAddress> [network]
 * 
 * Examples:
 * npm run test:withdraw 8H3kyZCtLpV3ugf8hVAYHL5sPuYz92jbGaqLAjz7uzEp
 * npm run test:withdraw 8H3kyZCtLpV3ugf8hVAYHL5sPuYz92jbGaqLAjz7uzEp devnet
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("❌ Usage: npm run test:withdraw <timeLockAccountAddress> [network]");
    console.error("   network: 'localnet' (default) or 'devnet'");
    process.exit(1);
  }

  const timeLockAccountStr = args[0];
  const network = args[1] || "localnet";
  
  console.log("🔧 Withdrawal Test Configuration:");
  console.log(`- Time Lock Account: ${timeLockAccountStr}`);
  console.log(`- Network: ${network}`);
  console.log("=====================================\n");

  try {
    // Validate the public key
    const timeLockAccount = new PublicKey(timeLockAccountStr);
    
    // Setup connection based on network
    let connection: Connection;
    if (network === "devnet") {
      connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    } else {
      connection = new Connection("http://127.0.0.1:8899", "confirmed");
    }

    // Setup provider and program
    const provider = new anchor.AnchorProvider(
      connection,
      anchor.AnchorProvider.env().wallet,
      { commitment: "confirmed" }
    );
    anchor.setProvider(provider);

    const program = anchor.workspace.timeLockedWallet as Program<TimeLockedWallet>;
    const wallet = provider.wallet;

    console.log("🔗 Connected to:", connection.rpcEndpoint);
    console.log("👛 Wallet:", wallet.publicKey.toString());
    console.log("💰 Program ID:", program.programId.toString());

    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💳 Current wallet balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

    // Check if the account exists
    try {
      const accountData = await program.account.timeLockAccount.fetch(timeLockAccount);
      console.log("📋 Current Account Data:");
      console.log(`  - Owner: ${accountData.owner.toString()}`);
      console.log(`  - Unlock Time: ${new Date(accountData.unlockTimestamp.toNumber() * 1000).toLocaleString()}`);
      console.log(`  - SOL Balance: ${accountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isUnlocked = currentTime >= accountData.unlockTimestamp.toNumber();
      const timeRemaining = Math.max(0, accountData.unlockTimestamp.toNumber() - currentTime);
      
      console.log(`  - Is Unlocked: ${isUnlocked}`);
      console.log(`  - Time Remaining: ${timeRemaining} seconds\n`);

      // Check if the account belongs to the current wallet
      if (accountData.owner.toString() !== wallet.publicKey.toString()) {
        throw new Error(`Account owner (${accountData.owner.toString()}) does not match wallet (${wallet.publicKey.toString()})`);
      }

      // Check if there's any SOL to withdraw
      if (accountData.amount.toNumber() === 0) {
        console.log("⚠️  No SOL to withdraw. Account balance is 0.");
        return;
      }

      if (!isUnlocked) {
        console.log(`🚫 Cannot withdraw yet. Time lock expires in ${timeRemaining} seconds.`);
        console.log(`   Unlock time: ${new Date(accountData.unlockTimestamp.toNumber() * 1000).toLocaleString()}`);
        return;
      }

      console.log("🎉 Account is unlocked! Proceeding with withdrawal...");

      // Attempt withdrawal
      const withdrawTx = await program.methods
        .withdrawSol()
        .rpc();

      console.log(`✅ Withdraw Transaction: ${withdrawTx}`);
      
      if (network === "devnet") {
        console.log(`🔗 View on Solana Explorer: https://explorer.solana.com/tx/${withdrawTx}?cluster=devnet`);
      }
      
      // Wait for confirmation
      await connection.confirmTransaction(withdrawTx, "confirmed");
      console.log("✅ Withdraw transaction confirmed");

      // Add a small delay for propagation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify withdrawal
      const finalAccountData = await program.account.timeLockAccount.fetch(timeLockAccount);
      console.log("\n📋 Final Account Data:");
      console.log(`  - SOL Balance: ${finalAccountData.amount.toNumber() / LAMPORTS_PER_SOL} SOL`);
      
      const finalWalletBalance = await connection.getBalance(wallet.publicKey);
      console.log(`💳 Final wallet balance: ${finalWalletBalance / LAMPORTS_PER_SOL} SOL`);

      console.log("\n🎉 Withdrawal completed successfully!");

    } catch (fetchError: any) {
      if (fetchError.message.includes("Account does not exist")) {
        console.error("❌ Time lock account does not exist or has not been initialized.");
      } else {
        throw fetchError;
      }
    }

  } catch (error: any) {
    console.error("❌ Error during withdrawal test:");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
