# 🔒 Time-Locked Wallet - TypeScript SDK

This TypeScript SDK provides a convenient wrapper for interacting with the Time-Locked Wallet program on Solana.

## 📦 Installation

```bash
npm install @solana/web3.js @coral-xyz/anchor
```

## 🚀 Quick Start

```typescript
import { TimeLockWalletSDK } from './sdk/TimeLockWalletSDK';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Initialize SDK
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const ownerKeypair = Keypair.generate(); // Your wallet keypair
const sdk = new TimeLockWalletSDK(connection, ownerKeypair);

// Create a time-locked wallet for 7 days
const wallet = await sdk.createWallet(7 * 24 * 60 * 60); // 7 days in seconds

// Lock 2 SOL
await wallet.depositSOL(2 * LAMPORTS_PER_SOL);

// Check status
const info = await wallet.getInfo();
console.log('Time remaining:', info.timeRemaining, 'seconds');

// Withdraw when unlocked
if (info.isUnlocked) {
  await wallet.withdrawSOL();
}
```

## 🛠️ SDK Class Reference

### TimeLockWalletSDK

Main SDK class for interacting with the program.

#### Constructor
```typescript
constructor(connection: Connection, owner: Keypair, programId?: PublicKey)
```

#### Methods

##### `createWallet(unlockDelay: number, assetType?: AssetType): Promise<TimeLockWallet>`
Creates a new time-locked wallet.

**Parameters:**
- `unlockDelay`: Time in seconds from now until unlock
- `assetType`: 'sol' | 'token' (default: 'sol')

**Returns:** TimeLockWallet instance

##### `getWallet(unlockTimestamp: number): TimeLockWallet`
Gets an existing time-locked wallet instance.

**Parameters:**
- `unlockTimestamp`: Unix timestamp when wallet unlocks

**Returns:** TimeLockWallet instance

### TimeLockWallet

Represents a specific time-locked wallet instance.

#### Properties
```typescript
readonly pda: PublicKey          // Wallet PDA address
readonly unlockTimestamp: number // When funds unlock
readonly owner: PublicKey        // Wallet owner
```

#### Methods

##### `depositSOL(amount: number): Promise<string>`
Deposits SOL into the time-locked wallet.

**Parameters:**
- `amount`: Amount in lamports

**Returns:** Transaction signature

##### `depositToken(mintAddress: PublicKey, amount: number): Promise<string>`
Deposits SPL tokens into the time-locked wallet.

**Parameters:**
- `mintAddress`: Token mint address
- `amount`: Amount of tokens (in smallest unit)

**Returns:** Transaction signature

##### `withdrawSOL(recipient?: PublicKey): Promise<string>`
Withdraws all SOL from the wallet (only when unlocked).

**Parameters:**
- `recipient`: Optional recipient address (defaults to owner)

**Returns:** Transaction signature

##### `withdrawToken(mintAddress: PublicKey): Promise<string>`
Withdraws all tokens from the wallet (only when unlocked).

**Parameters:**
- `mintAddress`: Token mint address

**Returns:** Transaction signature

##### `getInfo(): Promise<WalletInfo>`
Gets current wallet information.

**Returns:** WalletInfo object

##### `isUnlocked(): Promise<boolean>`
Checks if the wallet is currently unlocked.

**Returns:** Boolean indicating unlock status

##### `getTimeRemaining(): Promise<number>`
Gets remaining time until unlock.

**Returns:** Seconds remaining (0 if unlocked)

## 📊 Type Definitions

```typescript
interface WalletInfo {
  owner: PublicKey;
  unlockTimestamp: number;
  assetType: AssetType;
  amount: number;
  tokenVault: PublicKey;
  isUnlocked: boolean;
  timeRemaining: number;
}

type AssetType = 'sol' | 'token';

interface DepositEvent {
  timeLockAccount: PublicKey;
  depositor: PublicKey;
  amount: number;
  newBalance: number;
  timestamp: number;
  assetType: AssetType;
}

interface WithdrawalEvent {
  timeLockAccount: PublicKey;
  owner: PublicKey;
  recipient: PublicKey;
  amount: number;
  remainingBalance: number;
  timestamp: number;
  assetType: AssetType;
}
```

## 🎯 Advanced Usage Examples

### Multiple Wallets Management
```typescript
class WalletManager {
  private sdk: TimeLockWalletSDK;
  private wallets: Map<string, TimeLockWallet> = new Map();

  constructor(connection: Connection, owner: Keypair) {
    this.sdk = new TimeLockWalletSDK(connection, owner);
  }

  async createMonthlyWallet(amount: number): Promise<TimeLockWallet> {
    const wallet = await this.sdk.createWallet(30 * 24 * 60 * 60); // 30 days
    await wallet.depositSOL(amount);
    
    this.wallets.set(`monthly_${Date.now()}`, wallet);
    return wallet;
  }

  async getAllWallets(): Promise<WalletInfo[]> {
    const infos = [];
    for (const wallet of this.wallets.values()) {
      infos.push(await wallet.getInfo());
    }
    return infos;
  }

  async withdrawAllUnlocked(): Promise<string[]> {
    const signatures = [];
    for (const wallet of this.wallets.values()) {
      if (await wallet.isUnlocked()) {
        const sig = await wallet.withdrawSOL();
        signatures.push(sig);
      }
    }
    return signatures;
  }
}
```

### Event Monitoring
```typescript
class WalletMonitor {
  private sdk: TimeLockWalletSDK;

  constructor(connection: Connection, owner: Keypair) {
    this.sdk = new TimeLockWalletSDK(connection, owner);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Monitor deposits
    this.sdk.onDeposit((event) => {
      console.log(`💰 Deposit: ${event.amount} lamports to ${event.timeLockAccount}`);
      this.notifyUser(`Deposited ${event.amount / LAMPORTS_PER_SOL} SOL`);
    });

    // Monitor withdrawals
    this.sdk.onWithdrawal((event) => {
      console.log(`🏦 Withdrawal: ${event.amount} lamports from ${event.timeLockAccount}`);
      this.notifyUser(`Withdrawn ${event.amount / LAMPORTS_PER_SOL} SOL`);
    });

    // Monitor unlock events
    this.sdk.onUnlock((walletPDA) => {
      console.log(`🔓 Wallet unlocked: ${walletPDA}`);
      this.notifyUser('Your time-locked wallet is now available for withdrawal!');
    });
  }

  private notifyUser(message: string) {
    // Implement your notification system here
    console.log(`📢 Notification: ${message}`);
  }
}
```

### Batch Operations
```typescript
class BatchOperations {
  private sdk: TimeLockWalletSDK;

  constructor(connection: Connection, owner: Keypair) {
    this.sdk = new TimeLockWalletSDK(connection, owner);
  }

  async createSavingsPlan(
    monthlyAmount: number,
    months: number
  ): Promise<TimeLockWallet[]> {
    const wallets: TimeLockWallet[] = [];
    
    for (let i = 0; i < months; i++) {
      const unlockDelay = (i + 1) * 30 * 24 * 60 * 60; // Each month
      const wallet = await this.sdk.createWallet(unlockDelay);
      await wallet.depositSOL(monthlyAmount);
      
      wallets.push(wallet);
      
      console.log(`✅ Created wallet ${i + 1}/${months} - Unlocks in ${i + 1} months`);
    }
    
    return wallets;
  }

  async getPortfolioValue(wallets: TimeLockWallet[]): Promise<number> {
    let totalValue = 0;
    
    for (const wallet of wallets) {
      const info = await wallet.getInfo();
      totalValue += info.amount;
    }
    
    return totalValue;
  }
}
```

### Error Handling with Retry Logic
```typescript
class RobustWalletOperations {
  private sdk: TimeLockWalletSDK;

  constructor(connection: Connection, owner: Keypair) {
    this.sdk = new TimeLockWalletSDK(connection, owner);
  }

  async safeDeposit(
    wallet: TimeLockWallet,
    amount: number,
    maxRetries = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const signature = await wallet.depositSOL(amount);
        console.log(`✅ Deposit successful on attempt ${attempt}`);
        return signature;
      } catch (error) {
        console.log(`❌ Deposit attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Deposit failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Unexpected error in safeDeposit');
  }

  async safeWithdraw(
    wallet: TimeLockWallet,
    maxRetries = 3
  ): Promise<string> {
    // Check if unlocked first
    if (!(await wallet.isUnlocked())) {
      const timeRemaining = await wallet.getTimeRemaining();
      throw new Error(`Wallet still locked for ${timeRemaining} seconds`);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const signature = await wallet.withdrawSOL();
        console.log(`✅ Withdrawal successful on attempt ${attempt}`);
        return signature;
      } catch (error) {
        console.log(`❌ Withdrawal attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Withdrawal failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Unexpected error in safeWithdraw');
  }
}
```

## 🔧 Utility Functions

```typescript
// Time utilities
export const TimeUtils = {
  daysToSeconds: (days: number) => days * 24 * 60 * 60,
  hoursToSeconds: (hours: number) => hours * 60 * 60,
  minutesToSeconds: (minutes: number) => minutes * 60,
  
  formatTimeRemaining: (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
  
  timestampToDate: (timestamp: number) => new Date(timestamp * 1000),
  dateToTimestamp: (date: Date) => Math.floor(date.getTime() / 1000)
};

// Amount utilities
export const AmountUtils = {
  solToLamports: (sol: number) => sol * LAMPORTS_PER_SOL,
  lamportsToSol: (lamports: number) => lamports / LAMPORTS_PER_SOL,
  
  formatSOL: (lamports: number, decimals = 4) => {
    const sol = lamports / LAMPORTS_PER_SOL;
    return `${sol.toFixed(decimals)} SOL`;
  },
  
  formatToken: (amount: number, decimals: number, symbol: string) => {
    const formatted = amount / Math.pow(10, decimals);
    return `${formatted.toFixed(2)} ${symbol}`;
  }
};

// Validation utilities
export const ValidationUtils = {
  isValidAmount: (amount: number) => amount > 0 && Number.isFinite(amount),
  isValidTimestamp: (timestamp: number) => timestamp > Date.now() / 1000,
  isValidAddress: (address: string) => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
};
```

## 🧪 Testing Utilities

```typescript
// Testing helpers for development
export class TestUtils {
  static async airdropSOL(
    connection: Connection,
    address: PublicKey,
    amount: number = 2
  ): Promise<void> {
    const signature = await connection.requestAirdrop(
      address,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
    console.log(`💰 Airdropped ${amount} SOL to ${address.toString()}`);
  }

  static createTestWallet(): Keypair {
    const keypair = Keypair.generate();
    console.log(`🔑 Created test wallet: ${keypair.publicKey.toString()}`);
    return keypair;
  }

  static async waitForUnlock(wallet: TimeLockWallet): Promise<void> {
    console.log('⏰ Waiting for wallet to unlock...');
    
    while (!(await wallet.isUnlocked())) {
      const remaining = await wallet.getTimeRemaining();
      console.log(`⏱️ ${TimeUtils.formatTimeRemaining(remaining)} remaining`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
    
    console.log('🔓 Wallet is now unlocked!');
  }
}
```

This SDK provides a comprehensive TypeScript interface for the Time-Locked Wallet program, making it easy for developers to integrate time-locked functionality into their applications.
