# Time-Locked Wallet Tests

This directory contains comprehensive tests for the Time-Locked Wallet Solana program, designed to work on both localnet and devnet environments.

## Test Files

### 1. `localnet-test.ts`
Comprehensive test suite for localnet development and testing.

**Features:**
- Initialize time-locked wallet
- Deposit SOL
- Test withdrawal failure before unlock time
- Get wallet information
- Runs on localnet (http://127.0.0.1:8899)

**Usage:**
```bash
npm run test:localnet
```

### 2. `devnet-test.ts`
Full test suite for devnet testing, including automatic withdrawal after unlock time.

**Features:**
- All localnet features
- Automatic waiting for unlock time
- Real withdrawal test
- Solana Explorer links for transactions
- Runs on devnet (https://api.devnet.solana.com)

**Usage:**
```bash
npm run test:devnet
```

**Prerequisites for Devnet:**
- Ensure your wallet has devnet SOL
- Get devnet SOL from: https://faucet.solana.com/


### 3. `test-withdraw.ts`
Standalone withdrawal testing script that can be used with any existing time-locked wallet.

**Features:**
- Test withdrawal for any existing time-locked wallet
- Works on both localnet and devnet
- Checks unlock status before attempting withdrawal
- Detailed error reporting

**Usage:**
```bash
# For localnet
npm run test:withdraw <timeLockAccountAddress>

# For devnet
npm run test:withdraw <timeLockAccountAddress> devnet
```

**Example:**
```bash
npm run test:withdraw 8H3kyZCtLpV3ugf8hVAYHL5sPuYz92jbGaqLAjz7uzEp
npm run test:withdraw 8H3kyZCtLpV3ugf8hVAYHL5sPuYz92jbGaqLAjz7uzEp devnet
```

## Test Configuration

Each test file has its own configuration:

- **Localnet Tests**: 30-second unlock time, 0.1 SOL deposit
- **Devnet Tests**: 60-second unlock time, 0.01 SOL deposit (smaller for cost efficiency)
- **Manual Tests**: 30-second unlock time, 0.05 SOL deposit

## Running Tests

### Prerequisites

1. **For Localnet:**
   ```bash
   # Start local Solana validator
   solana-test-validator
   
   # Deploy program
   anchor deploy
   ```

2. **For Devnet:**
   ```bash
   # Set Solana CLI to devnet
   solana config set --url devnet
   
   # Ensure you have devnet SOL
   solana balance
   
   # If balance is low, request from faucet
   # Visit: https://faucet.solana.com/
   
   # Deploy program to devnet
   anchor deploy --provider.cluster devnet
   ```

### Test Commands

```bash
# Run localnet tests
npm run test:localnet

# Run devnet tests  
npm run test:devnet

# Run manual tests (uses current Anchor.toml configuration)
npm run test:manual

# Test withdrawal for specific account
npm run test:withdraw <account-address> [network]

# Run all tests
npm run test:all
```

## Test Flow

### Standard Test Flow:
1. **Initialize** - Create time-locked wallet with future unlock time
2. **Deposit** - Add SOL to the time-locked wallet
3. **Early Withdrawal Attempt** - Verify withdrawal fails before unlock time
4. **Get Info** - Retrieve wallet information and status
5. **Wait & Withdraw** - (Devnet only) Wait for unlock and successfully withdraw

### Withdrawal Test Flow:
1. **Validate** - Check if account exists and belongs to current wallet
2. **Check Status** - Verify unlock time and current balance
3. **Attempt Withdrawal** - Try to withdraw if unlocked
4. **Verify** - Confirm successful withdrawal

## Example Output

```
🔧 Localnet Test Configuration:
- RPC Endpoint: http://127.0.0.1:8899
- Unlock Time: 12/4/2025, 3:45:30 PM
- Deposit Amount: 0.1 SOL (100000000 lamports)
=====================================

🔗 Connected to: http://127.0.0.1:8899
👛 Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
💰 Program ID: 8H3kyZCtLpV3ugf8hVAYHL5sPuYz92jbGaqLAjz7uzEp
💳 Current wallet balance: 500 SOL

📍 Time Lock Account PDA: ABC123...
🎯 Bump: 254

✅ Initialize Transaction: 5J7...
✅ Initialize transaction confirmed
...
```

## Troubleshooting

### Common Issues:

1. **Insufficient Balance:**
   - For localnet: Use `solana airdrop` to add SOL
   - For devnet: Use the Solana faucet at https://faucet.solana.com/

2. **Program Not Found:**
   - Ensure the program is deployed: `anchor deploy`
   - Check `Anchor.toml` for correct program ID

3. **Connection Issues:**
   - For localnet: Ensure `solana-test-validator` is running
   - For devnet: Check internet connection and RPC endpoint

4. **Account Not Found:**
   - The time-locked wallet may not have been initialized
   - Check the account address is correct

### Environment Variables:

The tests use environment variables from Anchor:
- `ANCHOR_PROVIDER_URL` - RPC endpoint
- `ANCHOR_WALLET` - Wallet keypair path

These are automatically set by the npm scripts in `package.json`.

## Notes

- All tests include proper error handling and detailed logging
- Devnet tests include Solana Explorer links for easy transaction verification
- Tests use confirmation strategy "confirmed" for faster execution
- Automatic delays are included for devnet to handle network propagation
- The withdrawal test script can be used independently of the test suites
