# 🧪 Time-Locked Wallet Testing Suite

Comprehensive testing framework for Solana Time-Locked Wallet program with support for both **localnet** and **devnet** environments.

## 📋 Test Overview

This test suite validates all core functionality of the Time-Locked Wallet program:

- ✅ **Initialize** SOL time-locked wallets
- ✅ **Deposit** SOL to time-locked accounts  
- ✅ **Reject early withdrawal** (time-lock mechanism)
- ✅ **Allow withdrawal** after unlock time

## 🌐 Test Environments

### 🏠 **Localnet Testing**
- **File**: `localnet-test.ts`
- **Program ID**: `8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx`
- **Network**: Local Solana validator
- **Command**: `npm run test:localnet`
- **Requirements**: Running `solana-test-validator`

### 🌍 **Devnet Testing**
- **File**: `devnet-test.ts`  
- **Program ID**: `8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx`
- **Network**: Solana Devnet
- **Command**: `npm run test:devnet`
- **Requirements**: Funded wallet (≥0.1 SOL)

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Build the program
anchor build
```

### 1. Localnet Testing (Recommended for Development)

```bash
# Terminal 1: Start local validator
solana-test-validator --reset

# Terminal 2: Deploy and test
anchor deploy --provider.cluster localnet
npm run test:localnet
```

**Expected Output:**
```
🌐 LOCALNET Test Suite
Program ID: 8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx
✅ Airdrop confirmed
🏗️ Test 1: Initialize SOL Wallet ✅
💰 Test 2: Deposit SOL ✅  
🚫 Test 3: Early Withdrawal (should fail) ✅
⏰ Test 4: Wait and Withdraw ✅

4 passing (11s)
```

### 2. Devnet Testing (Production-like Environment)

```bash
# Step 1: Fund your wallet
solana config set --url devnet
solana airdrop 1  # or use https://faucet.solana.com

# Step 2: Deploy program (if needed)
anchor deploy --provider.cluster devnet

# Step 3: Run tests
npm run test:devnet
```

## 📊 Test Case Details

### Test 1: Initialize SOL Wallet
- **Purpose**: Create time-locked wallet with SOL type
- **Validation**: Account creation and data structure
- **Time**: ~1.5 seconds

### Test 2: Deposit SOL
- **Purpose**: Deposit SOL into time-locked wallet
- **Amount**: 0.05 SOL (devnet) / 0.1 SOL (localnet)
- **Validation**: Account balance increase
- **Time**: ~2 seconds

### Test 3: Early Withdrawal Rejection
- **Purpose**: Verify time-lock mechanism prevents early withdrawal
- **Validation**: Transaction fails with `TIME_LOCK_NOT_EXPIRED` error
- **Time**: ~1.5 seconds

### Test 4: Withdrawal After Unlock
- **Purpose**: Allow withdrawal after time-lock expires
- **Wait Time**: 15 seconds (devnet) / 10 seconds (localnet)
- **Validation**: Successful withdrawal and balance increase
- **Time**: ~18 seconds (including wait)

## 💰 Cost Analysis

### Localnet (Free)
- All operations are free
- Unlimited testing
- Instant airdrop

### Devnet
| Operation | Cost | Purpose |
|-----------|------|---------|
| Initialize | ~0.002 SOL | Account creation |
| Deposit | 0.05 SOL | Test amount |
| Transaction fees | ~0.003 SOL | Network fees |
| Buffer | ~0.045 SOL | Safety margin |
| **Total** | **~0.1 SOL** | **Full testing** |

## 🛠️ Available Commands

```bash
# Individual test suites
npm run test:localnet    # Local development testing
npm run test:devnet      # Devnet production testing

# Batch testing
npm run test:all         # Run both localnet and devnet

# Development utilities  
npm run test:debug       # Debug utilities
npm run test:inspect     # Account inspection
```

## 🔧 Configuration

### Program IDs
Both environments use the same program ID for consistency:
```
8PBuGBPVceKKMubCtwMY91BF3ZnrYaYXE7tF37gDGtyx
```

### Timeouts
- **Localnet**: 90 seconds (faster network)
- **Devnet**: 120 seconds (network latency)

### Account Seeds
Time-lock accounts use deterministic seeds:
```typescript
[
  Buffer.from("time_lock"),
  wallet.publicKey.toBuffer(), 
  unlockTimestamp.toArrayLike(Buffer, "le", 8)
]
```

## 🚨 Troubleshooting

### Issue 1: Program Not Found
```
Error: Program 8PBuG... not found
```
**Solution:**
```bash
# Deploy program first
anchor deploy --provider.cluster localnet  # or devnet
```

### Issue 2: Insufficient Balance (Devnet)
```
Error: Insufficient balance for testing
```
**Solution:**
```bash
# Fund your wallet
solana airdrop 1 --url devnet
# or use web faucet: https://faucet.solana.com
```

### Issue 3: Localnet Not Running
```
Error: Connection refused
```
**Solution:**
```bash
# Start validator in separate terminal
solana-test-validator --reset
```

### Issue 4: Account Already Exists
```
Error: Account already exists
```
**Solution:**
```bash
# Restart validator (localnet)
solana-test-validator --reset

# Or wait/use different timestamp (devnet)
```

## 📈 Performance Benchmarks

### Localnet Performance
- **Full test suite**: ~11 seconds
- **Network latency**: <100ms
- **Transaction confirmation**: <1 second

### Devnet Performance  
- **Full test suite**: ~25-30 seconds
- **Network latency**: 200-500ms
- **Transaction confirmation**: 1-3 seconds

## 🔍 Test Architecture

### Manual Transaction Building
Tests use manual transaction construction for maximum control:

```typescript
const instruction = await program.methods
  .initialize(unlockTimestamp, { sol: {} })
  .accountsPartial({
    timeLockAccount,
    initializer: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .instruction();

const tx = new Transaction().add(instruction);
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.feePayer = wallet.publicKey;
tx.sign(wallet);

const signature = await connection.sendRawTransaction(tx.serialize());
```

### Error Handling
Comprehensive error handling with specific validations:

```typescript
try {
  // Attempt operation
} catch (error) {
  // Validate expected error type
  expect(error.logs).to.satisfy((logs) => 
    logs.some(log => log.includes("TIME_LOCK_NOT_EXPIRED"))
  );
}
```

## 🎯 Best Practices

### For Development
1. **Use localnet** for rapid iteration
2. **Test individual cases** before full suite
3. **Monitor account states** with inspection tools
4. **Use meaningful timestamps** for debugging

### For CI/CD
1. **Start with localnet** validation  
2. **Include devnet** for integration testing
3. **Fund wallets** before pipeline runs
4. **Set appropriate timeouts** for network conditions

### For Production Validation
1. **Test on devnet** before mainnet deployment
2. **Validate all error cases** thoroughly
3. **Monitor gas costs** and optimize
4. **Document expected behaviors** clearly

## 📚 Related Documentation

- **Setup Guide**: See `DEVNET_SETUP.md` for wallet funding
- **Environment Guide**: See `ENVIRONMENT_GUIDE.md` for configuration
- **Program Documentation**: See `../docs/` for program architecture
- **Frontend Integration**: See `../frontend/` for UI components

## 🤝 Contributing

### Adding New Tests
1. Follow existing test patterns
2. Include both positive and negative cases  
3. Add appropriate timeouts
4. Document expected behaviors

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: Cross-function workflows
- **Environment Tests**: Network-specific validations
- **Error Tests**: Failure case handling

## 📄 License

This testing suite is part of the Time-Locked Wallet Solana Library project.

---

## 🎉 Success Criteria

✅ **All tests pass** on both environments  
✅ **Time-lock mechanism** works correctly  
✅ **Error handling** is comprehensive  
✅ **Performance** meets expectations  
✅ **Documentation** is complete  

**Ready to test?** Start with: `npm run test:localnet`
