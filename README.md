# Time-Locke# Time-Locked Wallet Solana Library

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Solana](https://img.shields.io/badge/solana-v1.78.0-purple)](#)
[![Anchor](https://img.shields.io/badge/anchor-v0.28.0-orange)](#)

A comprehensive Solana library for creating time-locked wallets that allows users to lock SOL or SPL tokens with a predefined unlock timestamp. Perfect for vesting schedules, savings plans, or any time-based asset management.

## 🌟 Features

- **🔒 Time-Locked Wallets**: Lock SOL or SPL tokens until a specific timestamp
- **⏰ Flexible Timing**: Support for any future timestamp (minutes to years)
- **🛡️ Security**: Built with reentrancy protection and comprehensive error handling
- **🔗 Solana Native**: Full integration with Solana's architecture using Anchor framework
- **📦 Developer Friendly**: TypeScript SDK with full type safety
- **⚛️ React Ready**: Pre-built hooks and components for frontend integration
- **🧪 Well Tested**: Comprehensive test suite for both devnet and localnet

## 📁 Project Structure

```
time-locked-wallet-solana-lib/
├── programs/
│   └── time-locked-wallet/     # Rust/Anchor Solana program
│       ├── src/
│       │   ├── lib.rs          # Main program entry point
│       │   ├── state.rs        # Account structures
│       │   ├── instructions/   # Program instructions
│       │   ├── errors.rs       # Custom error definitions
│       │   └── events.rs       # Event definitions
│       └── Cargo.toml
├── packages/
│   └── core/                   # TypeScript SDK
│       ├── src/
│       │   ├── client.ts       # Main client for production
│       │   ├── client-demo.ts  # Demo client for testing
│       │   ├── types.ts        # TypeScript definitions
│       │   ├── builders.ts     # Transaction builders
│       │   └── utils/          # Utility functions
│       └── package.json
├── target/
│   ├── idl/                    # Generated IDL files
│   └── types/                  # Generated TypeScript types
└── tests/                      # Test suites
    ├── localnet-test.ts        # Local development tests
    └── devnet-test.ts          # Devnet integration tests
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 16+ required
- **Rust**: Latest stable version
- **Solana CLI**: Version 1.14+ 
- **Anchor CLI**: Version 0.28+
- **Git**: For cloning the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/time-locked-wallet-solana-lib.git
cd time-locked-wallet-solana-lib

# Install dependencies
npm install

# Build the Anchor program
anchor build

# Run tests (requires Solana test validator)
anchor test
```

## 💡 How It Works

### Core Concept

The Time-Locked Wallet uses **Program Derived Addresses (PDAs)** to create secure, deterministic wallet addresses that can only be unlocked after a specified timestamp. Here's the flow:

1. **Initialize**: Create a time-locked wallet with an unlock timestamp
2. **Deposit**: Lock SOL or SPL tokens into the wallet  
3. **Wait**: Funds remain locked until the unlock timestamp
4. **Withdraw**: Once unlocked, only the owner can withdraw funds

### Key Components

#### 1. **Solana Program** (`programs/time-locked-wallet/`)
The on-chain Rust program handles:
- Wallet initialization with unlock timestamps
- Secure fund deposits (SOL and SPL tokens)
- Time-based withdrawal validation
- PDA-based security model

#### 2. **TypeScript SDK** (`packages/core/`)
The client library provides:
- Easy-to-use JavaScript/TypeScript API
- Transaction building and signing
- Account data fetching and parsing
- Error handling and validation

#### 3. **Generated Types** (`target/types/`)
Auto-generated TypeScript definitions from the Anchor IDL for type safety.

## 📖 Usage Examples

### Basic SOL Time-Lock

```typescript
import { TimeLockClient, AssetType } from '@time-locked-wallet/core';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const connection = new Connection('https://api.devnet.solana.com');
const client = new TimeLockClient(connection, wallet);

// Create a time-locked wallet (unlock in 1 hour)
const unlockTimestamp = Math.floor(Date.now() / 1000) + 3600;
const result = await client.createSolTimeLock({
  owner: wallet.publicKey,
  unlockTimestamp,
  assetType: AssetType.Sol,
  amount: 1000000000 // 1 SOL in lamports
});

console.log('Time-lock created:', result.timeLockAccount.toString());
console.log('Transaction signature:', result.signature);
```

### Deposit Additional Funds

```typescript
// Deposit more SOL to existing time-lock
await client.depositSol({
  timeLockAccount: result.timeLockAccount,
  amount: 500000000 // 0.5 SOL in lamports
});
```

### Check Withdrawal Availability

```typescript
// Check if funds can be withdrawn
const canWithdraw = await client.canWithdraw(result.timeLockAccount);
const remainingTime = await client.getRemainingLockTime(result.timeLockAccount);

console.log('Can withdraw:', canWithdraw);
console.log('Time remaining:', remainingTime, 'seconds');
```

### Withdraw Funds

```typescript
// Withdraw funds (only works after unlock time)
if (canWithdraw) {
  const signature = await client.withdrawSol({
    timeLockAccount: result.timeLockAccount,
    owner: wallet.publicKey
  });
  console.log('Withdrawal successful:', signature);
}
```

### Working with SPL Tokens

```typescript
// Create token time-lock
const tokenResult = await client.createTokenTimeLock({
  owner: wallet.publicKey,
  unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  assetType: AssetType.Token
});

// Deposit tokens
await client.depositToken({
  timeLockAccount: tokenResult.timeLockAccount,
  amount: 1000000, // Token amount (adjust for decimals)
  tokenFromAta: userTokenAccount,
  tokenVault: vaultAccount,
  tokenProgramId: TOKEN_PROGRAM_ID
});
```

## 🔧 Configuration

### Program ID

The program is deployed with the following ID:
```
899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g
```

### Network Configuration

```typescript
// Devnet
const connection = new Connection('https://api.devnet.solana.com');

// Mainnet Beta
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Localnet (for development)
const connection = new Connection('http://localhost:8899');
```

## 🧪 Testing

The project includes a comprehensive testing suite for both development and production environments.

### Quick Start
```bash
# Local development testing
npm run test:localnet

# Production-like testing  
npm run test:devnet

# Both environments
npm run test:all

# Show all available test commands
npm run test:help
```

### Detailed Testing Documentation
- **📋 Complete Guide**: [`tests/README.md`](./tests/README.md) - Full testing documentation
- **🚀 Quick Start**: [`tests/QUICK_START.md`](./tests/QUICK_START.md) - TL;DR version
- **🌍 Devnet Setup**: [`tests/DEVNET_SETUP.md`](./tests/DEVNET_SETUP.md) - Wallet funding guide

### Test Coverage
✅ **Initialize** SOL time-locked wallets  
✅ **Deposit** SOL to time-locked accounts  
✅ **Reject early withdrawal** (time-lock mechanism)  
✅ **Allow withdrawal** after unlock time

**Performance**: 4/4 tests passing in ~11s (localnet) / ~25s (devnet)

### Run Local Tests

```bash
# Start local Solana test validator
solana-test-validator

# In another terminal, run tests
anchor test --skip-deploy
```

### Run Devnet Tests

```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Run devnet integration tests
npm run test:devnet
```

## 🔒 Security Features

### Reentrancy Protection
- Operations are protected against reentrancy attacks
- Uses a processing flag to prevent concurrent operations

### PDA Security
- All wallets use Program Derived Addresses
- Deterministic addresses based on owner + timestamp
- No private key management required

### Time Validation
- Unlock timestamps must be in the future
- Clock-based validation using Solana's on-chain clock
- Protection against time manipulation

### Error Handling
- Comprehensive error types and messages
- Input validation on all parameters
- Clear error reporting for debugging

## 📚 API Reference

### TimeLockClient Methods

#### SOL Operations
- `createSolTimeLock(params)` - Create new SOL time-lock
- `depositSol(params)` - Deposit SOL to existing time-lock
- `withdrawSol(params)` - Withdraw SOL (if unlocked)

#### Token Operations  
- `createTokenTimeLock(params)` - Create new token time-lock
- `depositToken(params)` - Deposit tokens to existing time-lock
- `withdrawToken(params)` - Withdraw tokens (if unlocked)

#### Query Operations
- `getTimeLockData(account)` - Get time-lock account data
- `canWithdraw(account)` - Check if withdrawal is available
- `getRemainingLockTime(account)` - Get seconds until unlock

#### Utility Methods
- `findTimeLockPDA(owner, timestamp)` - Calculate PDA address
- `validatePublicKey(key)` - Validate public key format
- `validateTimestamp(timestamp)` - Validate timestamp format
- `validateAmount(amount)` - Validate amount format

### Types

```typescript
interface CreateTimeLockParams {
  owner: PublicKey;
  unlockTimestamp: number;
  assetType: AssetType;
  amount?: number;
}

interface DepositParams {
  timeLockAccount: PublicKey;
  amount: number;
  depositor?: PublicKey;
}

interface WithdrawParams {
  timeLockAccount: PublicKey;
  owner: PublicKey;
}

enum AssetType {
  Sol = "sol",
  Token = "token"
}
```

## 🐛 Troubleshooting

### Common Issues

**1. InstructionDidNotDeserialize Error**
```
Error Code: 102
```
- **Cause**: Mismatch between instruction parameters
- **Solution**: Ensure you're using the latest version and correct parameter types

**2. Custom Program Error: 0x1771**
```
Custom program error: 0x1771 (TimeLockNotExpired)
```
- **Cause**: Attempting to withdraw before unlock time
- **Solution**: Wait until unlock timestamp or check `canWithdraw()`

**3. Account Not Found**
```
Error: Account not found
```
- **Cause**: Time-lock account doesn't exist or incorrect PDA calculation
- **Solution**: Verify account was created and use correct owner/timestamp

### Getting Help

1. **Check the Tests**: Look at `tests/` directory for working examples
2. **Enable Debug Logs**: Use `ANCHOR_LOG=debug` for detailed logging
3. **Verify Network**: Ensure you're connecting to the correct network
4. **Check Balance**: Ensure sufficient SOL for transaction fees

## 🚧 Development

### Building from Source

```bash
# Clone and setup
git clone <repository-url>
cd time-locked-wallet-solana-lib
npm install

# Build program
anchor build

# Generate types
anchor run test

# Run development server (if using examples)
cd examples/react-vite
npm run dev
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Anchor Framework](https://project-serum.github.io/anchor/)
- Inspired by the Solana ecosystem
- Thanks to the Solana community for feedback and contributions

---