const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");

// Load the IDL
const idl = require("./target/idl/time_locked_wallet.json");

console.log("🔍 Testing withdraw_sol instruction definition...");

// Find the withdraw_sol instruction
const withdrawInstruction = idl.instructions.find(instruction => instruction.name === "withdraw_sol");

if (!withdrawInstruction) {
    console.log("❌ withdraw_sol instruction not found in IDL");
    process.exit(1);
}

console.log("✅ Found withdraw_sol instruction:");
console.log("📋 Accounts:", withdrawInstruction.accounts.map(acc => acc.name));
console.log("📋 Args:", withdrawInstruction.args);

// Check if the arguments are empty (should be empty after our fix)
if (withdrawInstruction.args.length === 0) {
    console.log("✅ SUCCESS: withdraw_sol instruction has no arguments (as expected)");
} else {
    console.log("❌ ISSUE: withdraw_sol instruction still has arguments:", withdrawInstruction.args);
}

// Check if recipient account is removed
const hasRecipient = withdrawInstruction.accounts.some(acc => acc.name === "recipient");
if (!hasRecipient) {
    console.log("✅ SUCCESS: recipient account removed (as expected)");
} else {
    console.log("❌ ISSUE: recipient account still present");
}

console.log("\n🎯 Summary: The withdraw_sol instruction should now work correctly with the test.");
