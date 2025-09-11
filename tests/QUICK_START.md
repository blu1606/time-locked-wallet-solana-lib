# 🚀 Quick Start Testing Guide

## TL;DR - Fast Testing

### 🏠 Localnet (Recommended)
```bash
# Terminal 1
solana-test-validator --reset

# Terminal 2  
anchor deploy --provider.cluster localnet
npm run test:localnet
```
**Result**: 4/4 tests in ~11 seconds ✅

### 🌍 Devnet 
```bash
# Fund wallet first
solana airdrop 1 --url devnet

# Run tests
npm run test:devnet  
```
**Result**: 4/4 tests in ~25 seconds ✅

## 💡 Commands
```bash
npm run test:help        # Show all commands
npm run test:localnet    # Local testing
npm run test:devnet      # Devnet testing  
npm run test:all         # Both environments
```

## 🆘 Common Issues
- **Program not found**: Run `anchor deploy`
- **No funds**: Run `solana airdrop 1 --url devnet`
- **Connection failed**: Start `solana-test-validator`

**Need details?** See [README.md](./README.md)
