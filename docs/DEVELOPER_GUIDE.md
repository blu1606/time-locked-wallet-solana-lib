# Developer Guide - Time-Locked Wallet Solana Library

This comprehensive guide will help you understand, set up, and develop with the Time-Locked Wallet Solana Library.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Architecture](#project-architecture)
4. [Development Workflow](#development-workflow)
5. [Building and Testing](#building-and-testing)
6. [API Usage](#api-usage)
7. [Advanced Topics](#advanced-topics)
8. [Best Practices](#best-practices)

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 16.0+ | JavaScript runtime for SDK and tooling |
| **Rust** | 1.70+ | Solana program development |
| **Solana CLI** | 1.14+ | Blockchain interaction and deployment |
| **Anchor CLI** | 0.28+ | Solana program framework |
| **Git** | Latest | Version control |
| **Yarn** | 4.9.4+ | Package management (preferred) |

### Knowledge Prerequisites

- **Solana Blockchain**: Understanding of accounts, transactions, and PDAs
- **Rust Programming**: Basic to intermediate Rust knowledge
- **TypeScript/JavaScript**: For SDK development and frontend integration
- **Anchor Framework**: Familiarity with Anchor's patterns and concepts

## Development Environment Setup

### 1. Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Verify installations
solana --version
anchor --version
rustc --version
node --version
```

### 2. Configure Solana

```bash
# Configure for local development
solana config set --url localhost

# Generate a keypair (if you don't have one)
solana-keygen new

# Get some SOL for testing (devnet)
solana config set --url devnet
solana airdrop 2
```

### 3. Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/your-org/time-locked-wallet-solana-lib.git
cd time-locked-wallet-solana-lib

# Install dependencies
npm install

# Build the project
anchor build

# Run initial tests
anchor test
```

## Project Architecture

### High-Level Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend App  │    │   TypeScript    │    │   Solana        │
│   (React/Vue/   │◄──►│   SDK           │◄──►│   Program       │
│   Vanilla JS)   │    │   (packages/)   │    │   (programs/)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Breakdown

#### 1. Solana Program (`programs/time-locked-wallet/`)

**Core Files:**
- `lib.rs` - Main program entry point with instruction handlers
- `state.rs` - Account structures and data models
- `instructions/` - Individual instruction implementations
- `errors.rs` - Custom error definitions
- `events.rs` - Event definitions for logging

**Key Concepts:**
- **PDA Generation**: Deterministic addresses based on owner + timestamp
- **Time Validation**: Uses Solana's on-chain clock for timestamp verification
- **Asset Support**: Handles both SOL and SPL tokens
- **Security**: Reentrancy protection and comprehensive validation

#### 2. TypeScript SDK (`packages/core/`)

**Core Files:**
- `client.ts` - Main production client with full Anchor integration
- `client-demo.ts` - Demo client for testing and development
- `types.ts` - TypeScript type definitions
- `builders.ts` - Transaction building utilities
- `instructions.ts` - High-level instruction helpers

**Features:**
- Type-safe API with full TypeScript support
- Automatic transaction building and signing
- Error handling and validation
- Connection management and retry logic

### Data Flow

```
1. User Request (Frontend)
    ↓
2. SDK Method Call (TypeScript)
    ↓
3. Transaction Building (Builders)
    ↓
4. RPC Call (Solana Network)
    ↓
5. Program Execution (Rust)
    ↓
6. State Update (On-chain)
    ↓
7. Response/Events (Back to Frontend)
```

## Development Workflow

### 1. Program Development

```bash
# Make changes to Rust code in programs/time-locked-wallet/src/
# Build and test changes
anchor build
anchor test

# Deploy to localnet for testing
anchor deploy

# Deploy to devnet for integration testing
anchor deploy --provider.cluster devnet
```

### 2. SDK Development

```bash
# Navigate to SDK package
cd packages/core

# Make TypeScript changes
# Build the package
npm run build

# Test the changes
npm run test
```

### 3. Integration Testing

```bash
# Run full test suite
anchor test

# Run specific test files
npx ts-mocha tests/localnet-test.ts
npx ts-mocha tests/devnet-test.ts

# Run with debug output
ANCHOR_LOG=debug anchor test
```

## Building and Testing

### Build Commands

```bash
# Build everything
anchor build

# Build only the program
anchor build --program-name time-locked-wallet

# Build with verification
anchor build --verifiable

# Clean build artifacts
anchor clean
```

### Testing Strategy

#### Unit Tests (Rust)
```bash
# Run Rust unit tests
cd programs/time-locked-wallet
cargo test
```

#### Integration Tests (TypeScript)
```bash
# Local validator tests
anchor test

# Devnet tests  
npm run test:devnet

# Specific test patterns
npx ts-mocha tests/**/*.ts --grep "withdraw"
```

#### Test Structure
```
tests/
├── localnet-test.ts      # Local validator integration tests
├── devnet-test.ts        # Devnet integration tests
└── utils/
    ├── setup.ts          # Test setup utilities
    └── helpers.ts        # Test helper functions
```

## API Usage

### Basic Client Setup

```typescript
import { TimeLockClient, AssetType } from '@time-locked-wallet/core';
import { Connection, Keypair } from '@solana/web3.js';

// Initialize connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Initialize wallet (in production, use proper wallet adapter)
const wallet = new anchor.Wallet(Keypair.generate());

// Create client
const client = new TimeLockClient(connection, wallet);
```

### Core Operations

#### Creating a Time-Lock

```typescript
// SOL time-lock
const solResult = await client.createSolTimeLock({
  owner: wallet.publicKey,
  unlockTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  assetType: AssetType.Sol,
  amount: 1_000_000_000 // 1 SOL in lamports
});

// Token time-lock
const tokenResult = await client.createTokenTimeLock({
  owner: wallet.publicKey,
  unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  assetType: AssetType.Token
});
```

#### Depositing Assets

```typescript
// Deposit SOL
await client.depositSol({
  timeLockAccount: solResult.timeLockAccount,
  amount: 500_000_000 // 0.5 SOL
});

// Deposit tokens
await client.depositToken({
  timeLockAccount: tokenResult.timeLockAccount,
  amount: 1000000, // Adjust for token decimals
  tokenFromAta: userTokenAccount,
  tokenVault: vaultAccount,
  tokenProgramId: TOKEN_PROGRAM_ID
});
```

#### Querying Information

```typescript
// Check if withdrawal is available
const canWithdraw = await client.canWithdraw(timeLockAccount);

// Get remaining time
const timeRemaining = await client.getRemainingLockTime(timeLockAccount);

// Get full account data
const accountData = await client.getTimeLockData(timeLockAccount);
```

#### Withdrawing Assets

```typescript
// Withdraw SOL (only after unlock time)
if (canWithdraw) {
  const signature = await client.withdrawSol({
    timeLockAccount: solResult.timeLockAccount,
    owner: wallet.publicKey
  });
  console.log('Withdrawal successful:', signature);
}

// Withdraw tokens
const tokenSignature = await client.withdrawToken({
  timeLockAccount: tokenResult.timeLockAccount,
  owner: wallet.publicKey,
  tokenFromVault: vaultAccount,
  tokenToAta: userTokenAccount,
  tokenProgramId: TOKEN_PROGRAM_ID
});
```

## Advanced Topics

### Custom Program Modifications

#### Adding New Instructions

1. **Define the instruction** in `programs/time-locked-wallet/src/instructions/`
2. **Add the handler** in `lib.rs`
3. **Update the IDL** by rebuilding with `anchor build`
4. **Add TypeScript support** in the SDK

Example:
```rust
// In instructions/mod.rs
pub mod my_new_instruction;
pub use my_new_instruction::*;

// In lib.rs
pub fn my_new_instruction(ctx: Context<MyNewInstruction>) -> Result<()> {
    instructions::my_new_instruction(ctx)
}
```

#### Modifying Account Structure

1. **Update state.rs** with new fields
2. **Update INIT_SPACE** calculation
3. **Handle migration** if needed for existing accounts
4. **Rebuild and test** thoroughly

### Error Handling

#### Custom Errors

```rust
// In errors.rs
#[error_code]
pub enum TimeLockError {
    #[msg("The unlock timestamp has not been reached")]
    TimeLockNotExpired,
    #[msg("Invalid amount provided")]
    InvalidAmount,
    // Add your custom errors here
}
```

#### TypeScript Error Handling

```typescript
try {
  await client.withdrawSol(params);
} catch (error) {
  if (error.code === 6001) { // TimeLockNotExpired
    console.log('Cannot withdraw yet, time lock not expired');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Performance Optimization

#### Transaction Batching

```typescript
// Combine multiple operations in one transaction
const transaction = new Transaction();
transaction.add(
  await client.instructions.buildSolDeposit(params1),
  await client.instructions.buildSolDeposit(params2)
);

const signature = await client.sendAndConfirmTransaction(transaction);
```

#### Connection Optimization

```typescript
// Use connection pooling for high-throughput applications
const connection = new Connection(rpcUrl, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  wsEndpoint: wsUrl
});
```

## Best Practices

### Security

1. **Always validate inputs** on both client and program sides
2. **Use proper error handling** to avoid exposing sensitive information
3. **Implement reentrancy protection** for critical operations
4. **Test thoroughly** on devnet before mainnet deployment

### Performance

1. **Minimize RPC calls** by batching operations
2. **Use appropriate commitment levels** based on your needs
3. **Cache frequently accessed data** when possible
4. **Implement retry logic** for network failures

### Development

1. **Follow consistent coding standards** (see CODE_STANDARDS.md)
2. **Write comprehensive tests** for all functionality
3. **Document your code** with clear comments
4. **Use meaningful variable and function names**

### Testing

1. **Test edge cases** and error conditions
2. **Use both unit and integration tests**
3. **Test on multiple networks** (localnet, devnet, mainnet)
4. **Verify gas costs** and transaction sizes

## Debugging Tips

### Common Issues

1. **Account Not Found**: Check PDA calculation and ensure account is initialized
2. **Insufficient Funds**: Verify wallet has enough SOL for transaction fees
3. **Time Validation Errors**: Ensure timestamps are in seconds, not milliseconds
4. **Type Errors**: Verify TypeScript types match the IDL definitions

### Debug Tools

```bash
# Enable detailed logging
export ANCHOR_LOG=debug

# Use Solana CLI for account inspection
solana account <account-address>

# Check transaction details
solana confirm <transaction-signature>

# Monitor program logs
solana logs <program-id>
```

### VS Code Setup

Recommended extensions:
- Rust Analyzer
- Solana Developer Tools
- TypeScript Importer
- Error Lens

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

## Need Help?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
2. Review the [API Reference](./API_REFERENCE.md) for method details
3. Look at test files for usage examples
4. Create an issue on GitHub for bug reports or feature requests

---

Happy developing! 🚀
