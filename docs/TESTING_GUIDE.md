# Testing Guide - Time-Locked Wallet Solana Library

This comprehensive testing guide covers all aspects of testing the Time-Locked Wallet Solana Library, from unit tests to end-to-end integration testing.

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Types](#test-types)
4. [Running Tests](#running-tests)
5. [Test Scenarios](#test-scenarios)
6. [Manual Testing](#manual-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Debugging Tests](#debugging-tests)
10. [CI/CD Testing](#cicd-testing)

## Testing Overview

### Testing Strategy

Our testing approach follows a multi-layered strategy:

```
┌─────────────────────────────────────────┐
│           E2E Tests (Devnet)            │  ← Real network conditions
├─────────────────────────────────────────┤
│       Integration Tests (Localnet)     │  ← Full program interaction
├─────────────────────────────────────────┤
│          Unit Tests (Rust)             │  ← Individual function testing
├─────────────────────────────────────────┤
│        SDK Tests (TypeScript)          │  ← Client library testing
└─────────────────────────────────────────┘
```

### Test Coverage Goals

- **Program Instructions**: 100% coverage of all Rust functions
- **SDK Methods**: 100% coverage of all TypeScript client methods  
- **Error Conditions**: All error paths tested
- **Edge Cases**: Boundary conditions and unusual scenarios
- **Security**: Reentrancy, unauthorized access, and validation bypasses

#### New Feature Coverage (Account Closure & Rent Reclaim)

- **Account Closure Instructions**: 100% coverage of all closure methods
  - `withdraw_and_close_sol`: Complete SOL withdrawal with account closure
  - `close_token_account`: Token account cleanup with rent reclaim
  - `close_empty_account`: Empty account removal with rent refund
  - `force_close_expired`: Forced closure of expired time-locks
- **Event Emission**: 100% coverage of event emission and listener functionality
- **Security Boundaries**: Complete validation of authorization and access controls
- **Rent Reclaim Logic**: Full validation of rent calculation and refund processes

## Test Environment Setup

### Prerequisites

```bash
# Ensure you have the required tools
solana --version          # Should be 1.14+
anchor --version          # Should be 0.28+
node --version           # Should be 16+
```

### Local Test Validator

```bash
# Start local validator with required features
solana-test-validator \
  --reset \
  --quiet \
  --bpf-program 899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g \
  target/deploy/time_locked_wallet.so
```

### Test Configuration

Create a test configuration file:

```typescript
// tests/config.ts
export const TEST_CONFIG = {
  LOCALNET: {
    endpoint: 'http://localhost:8899',
    commitment: 'confirmed' as web3.Commitment,
  },
  DEVNET: {
    endpoint: 'https://api.devnet.solana.com',
    commitment: 'confirmed' as web3.Commitment,
  },
  PROGRAM_ID: '899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g',
  DEFAULT_AMOUNTS: {
    SOL: 1_000_000_000, // 1 SOL in lamports
    TOKEN: 1_000_000,   // 1 token (6 decimals)
  },
  TIMEOUTS: {
    UNLOCK_DELAY: 60,    // 1 minute for testing
    LONG_TEST: 300_000,  // 5 minutes
    DEFAULT: 30_000,     // 30 seconds
  },
};
```

## Test Types

### 1. Unit Tests (Rust)

Located in: `programs/time-locked-wallet/src/`

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_time_lock_pda_generation() {
        let owner = Pubkey::new_unique();
        let timestamp = 1693900800; // Sample timestamp
        
        let (pda, bump) = get_time_lock_pda(&owner, timestamp);
        
        // Verify PDA is deterministic
        let (pda2, bump2) = get_time_lock_pda(&owner, timestamp);
        assert_eq!(pda, pda2);
        assert_eq!(bump, bump2);
    }
    
    #[test]
    fn test_time_validation() {
        let mut account = TimeLockAccount {
            unlock_timestamp: 1693900800,
            ..Default::default()
        };
        
        // Should fail before unlock time
        assert!(account.validate_withdrawal_time(1693900700).is_err());
        
        // Should pass after unlock time
        assert!(account.validate_withdrawal_time(1693900900).is_ok());
    }
}
```

### 2. Integration Tests (TypeScript)

Located in: `tests/`

#### Core Test Files

- **`localnet-test.ts`**: Basic functionality testing on local validator
- **`devnet-test.ts`**: Full integration testing on Solana devnet
- **`test-withdraw.ts`**: Comprehensive withdrawal scenario testing

#### New Feature Test Files (Account Closure & Rent Reclaim)

- **`account-closure-basic-test.ts`**: Core account closure functionality
  - Basic closure operations with rent reclaim validation
  - SOL account closure (`withdraw_and_close_sol`)
  - Token account closure (`close_token_account`)
  - Empty account cleanup (`close_empty_account`)
  
- **`security-basic-test.ts`**: Security and authorization validation
  - Unauthorized access prevention
  - PDA validation and ownership checks
  - Time-lock enforcement during closure operations
  
- **`closure-comprehensive-test.ts`**: Advanced closure scenarios
  - Multi-deposit accounts with partial withdrawals
  - Force closure of expired accounts (`force_close_expired`)
  - Edge cases and error condition handling
  
- **`event-emission-test.ts`**: Event system validation
  - `AccountClosed` event emission testing
  - `RentRefunded` event validation
  - Event listener functionality and data integrity

#### Localnet Tests

```typescript
// tests/localnet-test.ts
describe("Time-Locked Wallet Localnet Tests", () => {
  let client: TimeLockClient;
  let connection: Connection;
  let wallet: anchor.Wallet;
  
  before(async () => {
    connection = new Connection(TEST_CONFIG.LOCALNET.endpoint);
    wallet = anchor.AnchorProvider.env().wallet;
    client = new TimeLockClient(connection, wallet);
  });
  
  it("Should create SOL time-lock", async () => {
    const unlockTimestamp = Math.floor(Date.now() / 1000) + 3600;
    
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp,
      assetType: AssetType.Sol,
      amount: TEST_CONFIG.DEFAULT_AMOUNTS.SOL
    });
    
    expect(result.signature).to.be.a('string');
    expect(result.timeLockAccount).to.be.instanceOf(PublicKey);
    expect(result.assetType).to.equal(AssetType.Sol);
  });
});
```

#### Devnet Tests

```typescript
// tests/devnet-test.ts
describe("Time-Locked Wallet Devnet Tests", () => {
  it("Should handle real network conditions", async () => {
    // Test with actual network latency and conditions
    const connection = new Connection(TEST_CONFIG.DEVNET.endpoint);
    const client = new TimeLockClient(connection, wallet);
    
    // Test account creation on devnet
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: Math.floor(Date.now() / 1000) + 86400,
      assetType: AssetType.Sol
    });
    
    // Verify on blockchain explorer
    console.log(`View on explorer: https://explorer.solana.com/address/${result.timeLockAccount}?cluster=devnet`);
  });
});
```

### 3. SDK Tests

```typescript
// tests/sdk-test.ts
describe("SDK Client Tests", () => {
  it("Should validate input parameters", () => {
    expect(() => {
      TimeLockClient.validateAmount(-1);
    }).to.throw('Amount must be greater than 0');
    
    expect(() => {
      TimeLockClient.validateTimestamp(Date.now() / 1000 - 3600);
    }).to.throw('Timestamp must be in the future');
  });
  
  it("Should calculate PDA correctly", async () => {
    const owner = Keypair.generate().publicKey;
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    
    const [pda, bump] = await TimeLockClient.findTimeLockPDA(
      owner, 
      timestamp
    );
    
    expect(pda).to.be.instanceOf(PublicKey);
    expect(bump).to.be.a('number');
    expect(bump).to.be.at.least(0);
    expect(bump).to.be.at.most(255);
  });
});
```

## Running Tests

### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit          # Rust unit tests
npm run test:integration   # TypeScript integration tests
npm run test:localnet      # Local validator tests
npm run test:devnet        # Devnet tests

# Run with coverage
npm run test:coverage

# Run specific test file
npx ts-mocha tests/localnet-test.ts

# Run new feature test suites
npx ts-mocha tests/account-closure-basic-test.ts
npx ts-mocha tests/security-basic-test.ts  
npx ts-mocha tests/closure-comprehensive-test.ts
npx ts-mocha tests/event-emission-test.ts

# Run all closure-related tests
npx ts-mocha tests/*closure*.ts tests/*security*.ts tests/*event*.ts

# Run with debug output
ANCHOR_LOG=debug npm test
```

### Detailed Test Commands

```bash
# Rust unit tests
cd programs/time-locked-wallet
cargo test

# TypeScript tests with specific patterns
npx ts-mocha tests/**/*.ts --grep "withdraw"
npx ts-mocha tests/**/*.ts --grep "deposit"
npx ts-mocha tests/**/*.ts --grep "error"

# Run tests with timeout for slow operations
npx ts-mocha tests/devnet-test.ts --timeout 60000

# Run tests in parallel (for independent tests)
npx ts-mocha tests/**/*.ts --parallel
```

## Test Scenarios

### 1. Happy Path Scenarios

#### SOL Time-Lock Workflow

```typescript
describe("SOL Time-Lock Happy Path", () => {
  it("Should complete full SOL workflow", async () => {
    // 1. Create time-lock
    const unlockTime = Math.floor(Date.now() / 1000) + 60;
    const createResult = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    // 2. Verify creation
    const accountData = await client.getTimeLockData(createResult.timeLockAccount);
    expect(accountData.amount.toNumber()).to.equal(1_000_000_000);
    expect(accountData.unlockTimestamp.toNumber()).to.equal(unlockTime);
    
    // 3. Deposit additional funds
    await client.depositSol({
      timeLockAccount: createResult.timeLockAccount,
      amount: 500_000_000
    });
    
    // 4. Verify deposit
    const updatedData = await client.getTimeLockData(createResult.timeLockAccount);
    expect(updatedData.amount.toNumber()).to.equal(1_500_000_000);
    
    // 5. Wait for unlock time
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    // 6. Withdraw funds
    const withdrawResult = await client.withdrawSol({
      timeLockAccount: createResult.timeLockAccount,
      owner: wallet.publicKey
    });
    
    expect(withdrawResult).to.be.a('string');
    
    // 7. Verify withdrawal
    const finalData = await client.getTimeLockData(createResult.timeLockAccount);
    expect(finalData.amount.toNumber()).to.equal(0);
  });
});
```

#### Token Time-Lock Workflow

```typescript
describe("Token Time-Lock Happy Path", () => {
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  
  before(async () => {
    // Setup token accounts for testing
    // This would include creating mint, token accounts, etc.
  });
  
  it("Should complete full token workflow", async () => {
    // Similar to SOL workflow but with tokens
    // Implementation details...
  });
});
```

### 2. Error Condition Testing

#### Early Withdrawal Attempts

```typescript
describe("Error Conditions", () => {
  it("Should reject early withdrawal", async () => {
    const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    // Attempt withdrawal before unlock time
    try {
      await client.withdrawSol({
        timeLockAccount: result.timeLockAccount,
        owner: wallet.publicKey
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.code).to.equal(6001); // TimeLockNotExpired
      expect(error.message).to.include("not been reached");
    }
  });
  
  it("Should reject unauthorized withdrawal", async () => {
    const unauthorizedWallet = Keypair.generate();
    
    try {
      await client.withdrawSol({
        timeLockAccount: someTimeLockAccount,
        owner: unauthorizedWallet.publicKey
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.code).to.equal(6000); // Unauthorized
    }
  });
  
  it("Should reject invalid amounts", () => {
    expect(() => {
      TimeLockClient.validateAmount(0);
    }).to.throw("Amount must be greater than 0");
    
    expect(() => {
      TimeLockClient.validateAmount(-100);
    }).to.throw("Amount must be greater than 0");
  });
  
  it("Should reject past timestamps", () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600;
    
    expect(() => {
      TimeLockClient.validateTimestamp(pastTime);
    }).to.throw("Timestamp must be in the future");
  });
});
```

### 3. Edge Case Testing

```typescript
describe("Edge Cases", () => {
  it("Should handle minimum time difference", async () => {
    // Test with unlock time just 1 second in the future
    const unlockTime = Math.floor(Date.now() / 1000) + 1;
    
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1
    });
    
    // Wait and then withdraw
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const canWithdraw = await client.canWithdraw(result.timeLockAccount);
    expect(canWithdraw).to.be.true;
  });
  
  it("Should handle maximum timestamp", async () => {
    // Test with far future timestamp
    const maxTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60 * 10); // 10 years
    
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: maxTime,
      assetType: AssetType.Sol,
      amount: 1
    });
    
    const remainingTime = await client.getRemainingLockTime(result.timeLockAccount);
    expect(remainingTime).to.be.greaterThan(365 * 24 * 60 * 60 * 9); // At least 9 years
  });
  
  it("Should handle minimum amounts", async () => {
    // Test with 1 lamport
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: Math.floor(Date.now() / 1000) + 60,
      assetType: AssetType.Sol,
      amount: 1
    });
    
    const accountData = await client.getTimeLockData(result.timeLockAccount);
    expect(accountData.amount.toNumber()).to.equal(1);
  });
});
```

### 4. Account Closure Testing

```typescript
describe("Account Closure Operations", () => {
  it("Should withdraw and close SOL account", async () => {
    // Create account with SOL
    const unlockTime = Math.floor(Date.now() / 1000) + 60;
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    // Wait for unlock time
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    // Get initial recipient balance
    const initialBalance = await connection.getBalance(wallet.publicKey);
    
    // Withdraw and close account
    const signature = await client.withdrawAndCloseSol({
      timeLockAccount: result.timeLockAccount,
      owner: wallet.publicKey
    });
    
    // Verify account is closed
    const accountInfo = await connection.getAccountInfo(result.timeLockAccount);
    expect(accountInfo).to.be.null;
    
    // Verify balance increased (SOL + rent)
    const finalBalance = await connection.getBalance(wallet.publicKey);
    expect(finalBalance).to.be.greaterThan(initialBalance);
  });
  
  it("Should close empty account", async () => {
    // Create account without initial deposit
    const unlockTime = Math.floor(Date.now() / 1000) + 60;
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol
    });
    
    // Wait for unlock time
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    // Close empty account
    const signature = await client.closeEmptyAccount({
      timeLockAccount: result.timeLockAccount,
      owner: wallet.publicKey
    });
    
    // Verify account is closed
    const accountInfo = await connection.getAccountInfo(result.timeLockAccount);
    expect(accountInfo).to.be.null;
  });
  
  it("Should reject closing non-empty account with closeEmpty", async () => {
    const unlockTime = Math.floor(Date.now() / 1000) + 60;
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    try {
      await client.closeEmptyAccount({
        timeLockAccount: result.timeLockAccount,
        owner: wallet.publicKey
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.code).to.equal(6002); // AccountNotEmpty
    }
  });
  
  it("Should force close expired account", async () => {
    // This test would require admin/authority privileges
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: pastTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    // Force close with authority
    const signature = await client.forceCloseExpired({
      timeLockAccount: result.timeLockAccount,
      owner: wallet.publicKey
    });
    
    // Verify account is closed
    const accountInfo = await connection.getAccountInfo(result.timeLockAccount);
    expect(accountInfo).to.be.null;
  });
  
  it("Should emit closure events", async () => {
    let eventReceived = false;
    
    // Listen for account closure event
    const listener = client.program.addEventListener('AccountClosed', (event, slot) => {
      eventReceived = true;
      expect(event.timeLockAccount).to.be.ok;
      expect(event.rentRefunded).to.be.greaterThan(0);
    });
    
    // Create and close account
    const unlockTime = Math.floor(Date.now() / 1000) + 60;
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: unlockTime,
      assetType: AssetType.Sol,
      amount: 1_000_000_000
    });
    
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    await client.withdrawAndCloseSol({
      timeLockAccount: result.timeLockAccount,
      owner: wallet.publicKey
    });
    
    // Wait for event
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    expect(eventReceived).to.be.true;
    
    // Remove listener
    await client.program.removeEventListener(listener);
  });
});
```

### 5. Concurrent Operation Testing

```typescript
describe("Concurrent Operations", () => {
  it("Should handle multiple deposits to same account", async () => {
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
      assetType: AssetType.Sol
    });
    
    // Execute multiple deposits concurrently
    const deposits = [
      client.depositSol({
        timeLockAccount: result.timeLockAccount,
        amount: 100_000_000
      }),
      client.depositSol({
        timeLockAccount: result.timeLockAccount,
        amount: 200_000_000
      }),
      client.depositSol({
        timeLockAccount: result.timeLockAccount,
        amount: 300_000_000
      })
    ];
    
    await Promise.all(deposits);
    
    const finalData = await client.getTimeLockData(result.timeLockAccount);
    expect(finalData.amount.toNumber()).to.equal(600_000_000);
  });
  
  it("Should prevent reentrancy attacks", async () => {
    // Test reentrancy protection
    // This would involve attempting to call withdrawal multiple times
    // before the first one completes
  });
});
```

## Manual Testing

### 1. UI/Frontend Testing

If you have a frontend application:

```typescript
// Manual test checklist for frontend
const manualTestChecklist = {
  "Wallet Connection": [
    "Connect wallet successfully",
    "Display correct wallet address",
    "Handle wallet disconnection gracefully"
  ],
  "Time-Lock Creation": [
    "Create SOL time-lock with valid inputs",
    "Create token time-lock with valid inputs",
    "Display creation transaction hash",
    "Show time-lock account address"
  ],
  "Time-Lock Management": [
    "Display current balance correctly",
    "Show remaining lock time",
    "Update UI when lock expires",
    "Enable/disable withdraw button based on time"
  ],
  "Error Handling": [
    "Show meaningful error messages",
    "Handle network errors gracefully",
    "Validate inputs before submission",
    "Display transaction confirmation states"
  ]
};
```

### 2. Explorer Verification

```bash
# Commands for manual verification on Solana Explorer

# View account on devnet
echo "View account: https://explorer.solana.com/address/${ACCOUNT_ADDRESS}?cluster=devnet"

# View transaction
echo "View transaction: https://explorer.solana.com/tx/${TX_SIGNATURE}?cluster=devnet"

# View program
echo "View program: https://explorer.solana.com/address/899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g?cluster=devnet"
```

## Performance Testing

### 1. Transaction Throughput

```typescript
describe("Performance Tests", () => {
  it("Should handle batch operations efficiently", async () => {
    const startTime = Date.now();
    const operations = [];
    
    // Create multiple time-locks
    for (let i = 0; i < 10; i++) {
      operations.push(
        client.createSolTimeLock({
          owner: wallet.publicKey,
          unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
          assetType: AssetType.Sol,
          amount: 100_000_000
        })
      );
    }
    
    const results = await Promise.all(operations);
    const endTime = Date.now();
    
    expect(results).to.have.length(10);
    expect(endTime - startTime).to.be.lessThan(30000); // Should complete in 30 seconds
  });
  
  it("Should handle large amounts efficiently", async () => {
    // Test with maximum SOL amount
    const maxAmount = 500_000_000 * 1_000_000_000; // 500M SOL
    
    const result = await client.createSolTimeLock({
      owner: wallet.publicKey,
      unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
      assetType: AssetType.Sol,
      amount: maxAmount
    });
    
    expect(result.signature).to.be.a('string');
  });
});
```

### 2. Gas Cost Analysis

```typescript
it("Should optimize gas costs", async () => {
  const initialBalance = await connection.getBalance(wallet.publicKey);
  
  const result = await client.createSolTimeLock({
    owner: wallet.publicKey,
    unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
    assetType: AssetType.Sol,
    amount: 1_000_000_000
  });
  
  const finalBalance = await connection.getBalance(wallet.publicKey);
  const gasCost = initialBalance - finalBalance - 1_000_000_000; // Subtract deposited amount
  
  // Gas cost should be reasonable (less than 0.01 SOL)
  expect(gasCost).to.be.lessThan(10_000_000);
  
  console.log(`Gas cost: ${gasCost / 1_000_000_000} SOL`);
});
```

## Security Testing

### 1. Authorization Tests

```typescript
describe("Security Tests", () => {
  it("Should prevent unauthorized access", async () => {
    const maliciousWallet = Keypair.generate();
    
    // Try to withdraw from someone else's time-lock
    try {
      await client.withdrawSol({
        timeLockAccount: legitimateTimeLockAccount,
        owner: maliciousWallet.publicKey
      });
      expect.fail("Should have prevented unauthorized access");
    } catch (error) {
      expect(error.code).to.equal(6000); // Unauthorized error
    }
  });
  
  it("Should validate PDA ownership", async () => {
    // Test that accounts can only be accessed by rightful owners
    const owner1 = Keypair.generate();
    const owner2 = Keypair.generate();
    
    const [pda1] = await TimeLockClient.findTimeLockPDA(
      owner1.publicKey, 
      Math.floor(Date.now() / 1000) + 3600
    );
    
    const [pda2] = await TimeLockClient.findTimeLockPDA(
      owner2.publicKey, 
      Math.floor(Date.now() / 1000) + 3600
    );
    
    expect(pda1.toString()).to.not.equal(pda2.toString());
  });
});
```

### 2. Input Validation Tests

```typescript
describe("Input Validation Security", () => {
  it("Should sanitize all inputs", () => {
    // Test various malformed inputs
    const malformedInputs = [
      null,
      undefined,
      "",
      "not-a-public-key",
      "0x123", // Wrong format
      new Array(100).fill("a").join("") // Too long
    ];
    
    malformedInputs.forEach(input => {
      expect(() => {
        new PublicKey(input as any);
      }).to.throw();
    });
  });
});
```

## Debugging Tests

### 1. Enable Debug Logging

```bash
# Set debug environment variables
export ANCHOR_LOG=debug
export RUST_LOG=debug
export SOLANA_LOG=debug

# Run tests with verbose output
npm test -- --verbose
```

### 2. Debug Specific Issues

```typescript
// Add debugging to your tests
describe("Debug Test", () => {
  it("Should debug account state", async () => {
    const account = await client.getTimeLockData(timeLockAccount);
    
    console.log("Account Debug Info:", {
      owner: account.owner.toString(),
      unlockTimestamp: account.unlockTimestamp.toString(),
      amount: account.amount.toString(),
      assetType: account.assetType,
      isInitialized: account.isInitialized
    });
    
    // Check actual vs expected values
    console.log("Current time:", Math.floor(Date.now() / 1000));
    console.log("Unlock time:", account.unlockTimestamp.toNumber());
    console.log("Time remaining:", account.unlockTimestamp.toNumber() - Math.floor(Date.now() / 1000));
  });
});
```

### 3. Transaction Analysis

```typescript
it("Should analyze transaction details", async () => {
  const signature = await client.createSolTimeLock({
    owner: wallet.publicKey,
    unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
    assetType: AssetType.Sol,
    amount: 1_000_000_000
  });
  
  // Get transaction details
  const transaction = await connection.getTransaction(signature.signature, {
    commitment: 'confirmed'
  });
  
  console.log("Transaction Details:", {
    signature: signature.signature,
    slot: transaction?.slot,
    blockTime: transaction?.blockTime,
    fee: transaction?.meta?.fee,
    computeUnitsConsumed: transaction?.meta?.computeUnitsConsumed
  });
});
```

## CI/CD Testing

### 1. GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        
    - name: Install Solana
      run: |
        sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
        echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
        
    - name: Install Anchor
      run: npm install -g @coral-xyz/anchor-cli
      
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: |
        anchor test --skip-deploy
        npm run test:coverage
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### 2. Test Automation Scripts

```bash
#!/bin/bash
# scripts/run-tests.sh

set -e

echo "🚀 Starting test suite..."

# Start local validator
echo "📡 Starting local validator..."
solana-test-validator --reset --quiet &
VALIDATOR_PID=$!

# Wait for validator to be ready
sleep 5

# Run tests
echo "🧪 Running tests..."
anchor test --skip-deploy

# Stop validator
echo "🛑 Stopping validator..."
kill $VALIDATOR_PID

echo "✅ All tests completed successfully!"
```

## Test Reports and Coverage

### 1. Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### 2. Test Documentation

```typescript
// Generate test documentation
npx typedoc --out docs/test-docs src/

// Generate test reports
npx mocha tests/**/*.ts --reporter html > test-report.html
```

## Conclusion

This testing guide provides comprehensive coverage of all testing aspects for the Time-Locked Wallet Solana Library. Remember to:

1. **Run tests frequently** during development
2. **Test on multiple networks** (localnet, devnet, mainnet)
3. **Cover edge cases** and error conditions
4. **Monitor performance** and gas costs
5. **Validate security** assumptions
6. **Document test results** for future reference

For additional testing resources, see:
- [Test Cases Documentation](./TEST_CASES.md)
- [QA Checklist](./QA_CHECKLIST.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

Happy testing! 🧪
