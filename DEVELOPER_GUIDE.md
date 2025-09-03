# 🔒 Time-Locked Wallet Program - Developer Guide

## 📋 Overview

The Time-Locked Wallet is a secure Solana program that allows users to lock SOL or SPL tokens for a specified period. Once locked, funds cannot be withdrawn until the unlock timestamp is reached.

### 🌐 Deployed Program Info
- **Program ID**: `899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g`
- **Network**: Devnet
- **RPC Endpoint**: `https://api.devnet.solana.com`

---

## 🚀 Quick Start

### Installation

```bash
npm install @solana/web3.js @coral-xyz/anchor
```

### Basic Setup

```typescript
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';

// Program configuration
const PROGRAM_ID = new PublicKey('899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize provider and program
const wallet = new Wallet(yourKeypair); // Your wallet keypair
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, PROGRAM_ID, provider);
```

---

## 📚 Core Concepts

### 🏗️ Account Structure

Each time-locked wallet is a **Program Derived Address (PDA)** with the following structure:

```typescript
interface TimeLockAccount {
  owner: PublicKey;           // Account owner
  unlock_timestamp: number;   // Unix timestamp when funds unlock
  asset_type: AssetType;     // SOL or Token
  amount: number;            // Locked amount
  token_vault: PublicKey;    // Token vault (for SPL tokens)
  is_initialized: boolean;   // Initialization status
  sol_balance: number;       // SOL balance (for SOL locks)
  spl_token_account?: PublicKey; // SPL token account
  bump: number;              // PDA bump seed
  is_processing: boolean;    // Reentrancy protection
}

enum AssetType {
  Sol = { sol: {} },
  Token = { token: {} }
}
```

### 🔑 PDA Derivation

```typescript
// PDA seeds: ["time_lock", owner_pubkey, unlock_timestamp_bytes]
function findTimeLockPDA(owner: PublicKey, unlockTimestamp: number): [PublicKey, number] {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("time_lock"),
      owner.toBuffer(),
      Buffer.from(unlockTimestamp.toString().padStart(8, '0'))
    ],
    PROGRAM_ID
  );
  return [pda, bump];
}
```

---

## 🛠️ Core Instructions

### 1. 🏗️ Initialize Time Lock

Creates a new time-locked wallet account.

```typescript
async function initializeTimeLock(
  owner: Keypair,
  unlockTimestamp: number,
  assetType: AssetType
): Promise<string> {
  // Find PDA
  const [timeLockPDA] = findTimeLockPDA(owner.publicKey, unlockTimestamp);
  
  // Create instruction
  const tx = await program.methods
    .initialize(new BN(unlockTimestamp), assetType)
    .accounts({
      timeLockAccount: timeLockPDA,
      initializer: owner.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([owner])
    .rpc();
    
  console.log('✅ Time lock created:', tx);
  return tx;
}

// Usage
const unlockTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
await initializeTimeLock(ownerKeypair, unlockTime, { sol: {} });
```

### 2. 💰 Deposit SOL

Locks SOL tokens in the time-locked wallet.

```typescript
async function depositSOL(
  owner: Keypair,
  unlockTimestamp: number,
  amount: number // Amount in lamports
): Promise<string> {
  const [timeLockPDA] = findTimeLockPDA(owner.publicKey, unlockTimestamp);
  
  const tx = await program.methods
    .depositSol(new BN(amount))
    .accounts({
      timeLockAccount: timeLockPDA,
      initializer: owner.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([owner])
    .rpc();
    
  console.log('✅ SOL deposited:', tx);
  return tx;
}

// Usage - Deposit 1 SOL
await depositSOL(ownerKeypair, unlockTimestamp, 1_000_000_000);
```

### 3. 🪙 Deposit SPL Tokens

Locks SPL tokens in the time-locked wallet.

```typescript
import { getAssociatedTokenAddress, createAssociatedTokenAccount } from '@solana/spl-token';

async function depositToken(
  owner: Keypair,
  unlockTimestamp: number,
  mintAddress: PublicKey,
  amount: number
): Promise<string> {
  const [timeLockPDA] = findTimeLockPDA(owner.publicKey, unlockTimestamp);
  
  // Get token accounts
  const ownerTokenAccount = await getAssociatedTokenAddress(mintAddress, owner.publicKey);
  const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, timeLockPDA, true);
  
  const tx = await program.methods
    .depositToken(new BN(amount))
    .accounts({
      timeLockAccount: timeLockPDA,
      initializer: owner.publicKey,
      tokenFromAta: ownerTokenAccount,
      tokenVault: vaultTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([owner])
    .rpc();
    
  console.log('✅ Tokens deposited:', tx);
  return tx;
}
```

### 4. 🏦 Withdraw SOL

Withdraws all SOL from an unlocked time-locked wallet.

```typescript
async function withdrawSOL(
  owner: Keypair,
  unlockTimestamp: number,
  recipient?: PublicKey
): Promise<string> {
  const [timeLockPDA] = findTimeLockPDA(owner.publicKey, unlockTimestamp);
  const recipientKey = recipient || owner.publicKey;
  
  const tx = await program.methods
    .withdrawSol()
    .accounts({
      timeLockAccount: timeLockPDA,
      owner: owner.publicKey,
      recipient: recipientKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([owner])
    .rpc();
    
  console.log('✅ SOL withdrawn:', tx);
  return tx;
}
```

### 5. 🪙 Withdraw SPL Tokens

Withdraws all SPL tokens from an unlocked time-locked wallet.

```typescript
async function withdrawToken(
  owner: Keypair,
  unlockTimestamp: number,
  mintAddress: PublicKey
): Promise<string> {
  const [timeLockPDA] = findTimeLockPDA(owner.publicKey, unlockTimestamp);
  
  const ownerTokenAccount = await getAssociatedTokenAddress(mintAddress, owner.publicKey);
  const vaultTokenAccount = await getAssociatedTokenAddress(mintAddress, timeLockPDA, true);
  
  const tx = await program.methods
    .withdrawToken()
    .accounts({
      timeLockAccount: timeLockPDA,
      owner: owner.publicKey,
      tokenFromVault: vaultTokenAccount,
      tokenToAta: ownerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([owner])
    .rpc();
    
  console.log('✅ Tokens withdrawn:', tx);
  return tx;
}
```

### 6. 📊 Get Wallet Info

Retrieves information about a time-locked wallet without modifying state.

```typescript
async function getWalletInfo(
  owner: PublicKey,
  unlockTimestamp: number
): Promise<WalletInfo> {
  const [timeLockPDA] = findTimeLockPDA(owner, unlockTimestamp);
  
  const walletInfo = await program.methods
    .getWalletInfo()
    .accounts({
      timeLockAccount: timeLockPDA,
      owner: owner,
    })
    .view();
    
  return walletInfo;
}

interface WalletInfo {
  owner: PublicKey;
  unlock_timestamp: number;
  asset_type: AssetType;
  amount: number;
  token_vault: PublicKey;
  is_unlocked: boolean;
  time_remaining: number; // Seconds until unlock
}
```

---

## 🎯 Complete Example

```typescript
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';

class TimeLockWallet {
  constructor(
    private program: Program,
    private owner: Keypair
  ) {}

  // Create and fund a time-locked wallet
  async createAndFundWallet(daysLocked: number, solAmount: number) {
    const unlockTimestamp = Math.floor(Date.now() / 1000) + (daysLocked * 24 * 60 * 60);
    
    // 1. Initialize time lock
    console.log('🏗️ Creating time lock...');
    await this.program.methods
      .initialize(new BN(unlockTimestamp), { sol: {} })
      .accounts({
        timeLockAccount: this.getTimeLockPDA(unlockTimestamp)[0],
        initializer: this.owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.owner])
      .rpc();
    
    // 2. Deposit SOL
    console.log('💰 Depositing SOL...');
    await this.program.methods
      .depositSol(new BN(solAmount * LAMPORTS_PER_SOL))
      .accounts({
        timeLockAccount: this.getTimeLockPDA(unlockTimestamp)[0],
        initializer: this.owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.owner])
      .rpc();
    
    console.log(`✅ Successfully locked ${solAmount} SOL for ${daysLocked} days`);
    return { unlockTimestamp, timeLockPDA: this.getTimeLockPDA(unlockTimestamp)[0] };
  }

  // Check if funds can be withdrawn
  async checkUnlockStatus(unlockTimestamp: number) {
    const walletInfo = await this.getWalletInfo(unlockTimestamp);
    
    if (walletInfo.is_unlocked) {
      console.log('🔓 Wallet is unlocked! Funds can be withdrawn.');
    } else {
      const hoursRemaining = Math.ceil(walletInfo.time_remaining / 3600);
      console.log(`🔒 Wallet locked for ${hoursRemaining} more hours`);
    }
    
    return walletInfo;
  }

  // Withdraw all funds when unlocked
  async withdrawAll(unlockTimestamp: number) {
    const walletInfo = await this.checkUnlockStatus(unlockTimestamp);
    
    if (!walletInfo.is_unlocked) {
      throw new Error('Wallet is still locked!');
    }

    if (walletInfo.asset_type.sol) {
      await this.withdrawSOL(unlockTimestamp);
    } else if (walletInfo.asset_type.token) {
      // Implement token withdrawal based on your token mint
      console.log('Token withdrawal not implemented in this example');
    }
  }

  private getTimeLockPDA(unlockTimestamp: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("time_lock"),
        this.owner.publicKey.toBuffer(),
        Buffer.from(unlockTimestamp.toString().padStart(8, '0'))
      ],
      this.program.programId
    );
  }

  private async getWalletInfo(unlockTimestamp: number) {
    const [timeLockPDA] = this.getTimeLockPDA(unlockTimestamp);
    return await this.program.methods
      .getWalletInfo()
      .accounts({
        timeLockAccount: timeLockPDA,
        owner: this.owner.publicKey,
      })
      .view();
  }

  private async withdrawSOL(unlockTimestamp: number) {
    const [timeLockPDA] = this.getTimeLockPDA(unlockTimestamp);
    
    return await this.program.methods
      .withdrawSol()
      .accounts({
        timeLockAccount: timeLockPDA,
        owner: this.owner.publicKey,
        recipient: this.owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.owner])
      .rpc();
  }
}

// Usage
async function main() {
  const wallet = new TimeLockWallet(program, ownerKeypair);
  
  // Lock 2 SOL for 1 day
  const { unlockTimestamp } = await wallet.createAndFundWallet(1, 2);
  
  // Check status
  await wallet.checkUnlockStatus(unlockTimestamp);
  
  // Withdraw when ready (after 1 day)
  // await wallet.withdrawAll(unlockTimestamp);
}
```

---

## 📊 Event Listening

The program emits events that can be monitored:

```typescript
// Listen for time lock creation events
program.addEventListener('TimeLockCreated', (event) => {
  console.log('🏗️ New time lock created:', {
    account: event.timeLockAccount.toString(),
    owner: event.owner.toString(),
    unlockTime: new Date(event.unlockTimestamp * 1000),
    assetType: event.assetType
  });
});

// Listen for deposit events
program.addEventListener('DepositEvent', (event) => {
  console.log('💰 Deposit made:', {
    account: event.timeLockAccount.toString(),
    depositor: event.depositor.toString(),
    amount: event.amount.toString(),
    newBalance: event.newBalance.toString(),
    assetType: event.assetType
  });
});

// Listen for withdrawal events
program.addEventListener('WithdrawalEvent', (event) => {
  console.log('🏦 Withdrawal made:', {
    account: event.timeLockAccount.toString(),
    owner: event.owner.toString(),
    recipient: event.recipient.toString(),
    amount: event.amount.toString(),
    remainingBalance: event.remainingBalance.toString(),
    assetType: event.assetType
  });
});
```

---

## ⚠️ Error Handling

The program uses structured error codes for better error handling:

```typescript
const ERROR_CODES = {
  // Timing errors (1000-1099)
  TIME_LOCK_NOT_EXPIRED: 1001,
  INVALID_UNLOCK_TIME: 1002,
  
  // Balance errors (1100-1199)
  INSUFFICIENT_BALANCE: 1101,
  INVALID_AMOUNT: 1102,
  ACCOUNT_NOT_EMPTY: 1103,
  
  // Asset type errors (1200-1299)
  INVALID_ASSET_TYPE: 1201,
  INVALID_TOKEN_VAULT: 1202,
  
  // Authorization errors (1300-1399)
  UNAUTHORIZED: 1301,
  
  // Security errors (1400-1499)
  REENTRANCY_DETECTED: 1401,
  
  // State errors (1500-1599)
  NOT_INITIALIZED: 1501,
  
  // System errors (1600-1699)
  ARITHMETIC_OVERFLOW: 1601,
  TRANSFER_FAILED: 1602,
  UNSUPPORTED_VERSION: 1603,
};

// Error handling example
try {
  await wallet.withdrawAll(unlockTimestamp);
} catch (error) {
  if (error.code === ERROR_CODES.TIME_LOCK_NOT_EXPIRED) {
    console.log('⏰ Funds are still locked. Please wait until unlock time.');
  } else if (error.code === ERROR_CODES.INSUFFICIENT_BALANCE) {
    console.log('💸 Insufficient balance in the time-locked wallet.');
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
```

---

## 🛡️ Security Features

### Reentrancy Protection
The program includes built-in reentrancy protection to prevent malicious attacks.

### State Validation
All operations validate account state before execution:
- Account initialization status
- Asset type compatibility
- Time lock expiration
- Balance sufficiency

### Access Control
Only the account owner can:
- Deposit funds
- Withdraw funds (when unlocked)
- View wallet information

---

## 🧪 Testing

### Devnet Testing Checklist

1. **Setup**
   ```bash
   # Get devnet SOL
   solana airdrop 2 <your-address> --url devnet
   
   # Set cluster to devnet
   solana config set --url devnet
   ```

2. **Test Flow**
   ```typescript
   // 1. Create time lock with short duration for testing
   const unlockTime = Math.floor(Date.now() / 1000) + 60; // 1 minute
   
   // 2. Initialize and deposit
   await createAndFundWallet(0.001, 0.1); // 0.001 days = ~1.4 minutes
   
   // 3. Try early withdrawal (should fail)
   try {
     await withdrawAll(unlockTime);
   } catch (e) {
     console.log('✅ Early withdrawal properly blocked');
   }
   
   // 4. Wait and withdraw successfully
   setTimeout(async () => {
     await withdrawAll(unlockTime);
     console.log('✅ Withdrawal successful after unlock');
   }, 90000); // Wait 1.5 minutes
   ```

---

## 📖 IDL Reference

The program's Interface Definition Language (IDL) file is required for TypeScript integration:

```typescript
// You'll need to include the IDL in your project
import IDL from './time_locked_wallet.json';

// Or generate types
import { TimeLockWallet } from './target/types/time_lock_wallet';
```

---

## 🆘 Common Issues & Solutions

### Issue: "Account not found"
**Solution**: Make sure you're using the correct PDA derivation and the account has been initialized.

### Issue: "Time lock not expired"  
**Solution**: Check the current timestamp vs unlock timestamp. Use `getWalletInfo()` to see time remaining.

### Issue: "Insufficient balance"
**Solution**: Verify the account has been funded and the balance is sufficient for withdrawal.

### Issue: "Invalid asset type"
**Solution**: Ensure you're using the correct instruction for the asset type (SOL vs Token).

---

## 🔗 Resources

- **Devnet Explorer**: `https://explorer.solana.com/?cluster=devnet`
- **Program Address**: `899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g`
- **Solana Documentation**: `https://docs.solana.com/`
- **Anchor Framework**: `https://www.anchor-lang.com/`

---

## 📞 Support

For technical support or questions:
1. Check this documentation first
2. Review error codes and messages
3. Test on devnet before mainnet
4. Monitor program logs for detailed debugging information

**Happy building! 🚀**
