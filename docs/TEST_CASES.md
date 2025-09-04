# Test Cases - Time-Locked Wallet Solana Library

Comprehensive test case documentation covering all functional and non-functional testing scenarios.

## 📋 Table of Contents

1. [Test Case Overview](#test-case-overview)
2. [Functional Test Cases](#functional-test-cases)
3. [Security Test Cases](#security-test-cases)
4. [Performance Test Cases](#performance-test-cases)
5. [Error Handling Test Cases](#error-handling-test-cases)
6. [Integration Test Cases](#integration-test-cases)
7. [Edge Case Test Scenarios](#edge-case-test-scenarios)
8. [Regression Test Cases](#regression-test-cases)

## Test Case Overview

### Test Case Template

```
TC-XXX: [Test Case Title]
Priority: [High/Medium/Low]
Category: [Functional/Security/Performance/Integration]
Environment: [Localnet/Devnet/Mainnet]

Prerequisites:
- [Setup requirements]

Test Steps:
1. [Step description]
2. [Step description]

Expected Result:
- [Expected outcome]

Actual Result:
- [To be filled during execution]

Status: [Pass/Fail/Blocked]
```

## Functional Test Cases

### Account Creation Test Cases

#### TC-001: Create SOL Time-Lock Account
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet, Devnet

**Prerequisites:**
- Valid wallet with sufficient SOL balance
- Connected to test network

**Test Steps:**
1. Initialize TimeLockClient with valid connection and wallet
2. Call `createSolTimeLock()` with valid parameters:
   - `owner`: Valid public key
   - `unlockTimestamp`: Future timestamp (1 hour from now)
   - `assetType`: AssetType.Sol
   - `amount`: 1_000_000_000 (1 SOL)
3. Wait for transaction confirmation

**Expected Result:**
- Transaction succeeds
- Returns valid `LockCreationResult` with signature and account address
- Account is created on blockchain with correct data
- Account balance shows deposited amount

---

#### TC-002: Create Token Time-Lock Account
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet, Devnet

**Prerequisites:**
- Valid wallet with sufficient SOL for fees
- Valid SPL token mint and associated token account

**Test Steps:**
1. Initialize TimeLockClient
2. Call `createTokenTimeLock()` with valid parameters:
   - `owner`: Valid public key
   - `unlockTimestamp`: Future timestamp (24 hours from now)
   - `assetType`: AssetType.Token
3. Verify account creation

**Expected Result:**
- Transaction succeeds
- Token time-lock account created
- Correct asset type set in account data

---

#### TC-003: Create Time-Lock with Initial Deposit
- **Priority:** Medium
- **Category:** Functional
- **Environment:** Localnet

**Test Steps:**
1. Create SOL time-lock with initial amount
2. Verify both account creation and deposit in single transaction
3. Check final account balance

**Expected Result:**
- Single transaction creates account and deposits funds
- Account balance equals initial deposit amount

### Deposit Test Cases

#### TC-010: Deposit SOL to Existing Time-Lock
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet, Devnet

**Prerequisites:**
- Existing SOL time-lock account
- Sufficient SOL balance in wallet

**Test Steps:**
1. Get initial account balance
2. Call `depositSol()` with valid amount (0.5 SOL)
3. Wait for transaction confirmation
4. Fetch updated account data

**Expected Result:**
- Transaction succeeds
- Account balance increases by deposit amount
- Deposit event emitted

---

#### TC-011: Multiple Sequential Deposits
- **Priority:** Medium
- **Category:** Functional
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock account
2. Perform 3 sequential deposits of different amounts
3. Verify cumulative balance after each deposit

**Expected Result:**
- All deposits succeed
- Final balance equals sum of all deposits
- Each deposit properly updates account state

---

#### TC-012: Deposit SPL Tokens
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet, Devnet

**Prerequisites:**
- Token time-lock account
- User has tokens in associated token account

**Test Steps:**
1. Create token time-lock account
2. Deposit tokens using `depositToken()`
3. Verify token vault balance

**Expected Result:**
- Tokens transferred from user ATA to vault
- Account records correct token amount

### Withdrawal Test Cases

#### TC-020: Successful SOL Withdrawal After Unlock
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet

**Prerequisites:**
- SOL time-lock account with funds
- Current time past unlock timestamp

**Test Steps:**
1. Create time-lock with short unlock time (30 seconds)
2. Wait for unlock time to pass
3. Call `withdrawSol()`
4. Verify funds transferred to owner

**Expected Result:**
- Withdrawal succeeds
- Full balance transferred to owner
- Account balance reset to zero
- Withdrawal event emitted

---

#### TC-021: Successful Token Withdrawal After Unlock
- **Priority:** High
- **Category:** Functional
- **Environment:** Localnet

**Test Steps:**
1. Create token time-lock with short unlock time
2. Deposit tokens
3. Wait for unlock time
4. Call `withdrawToken()`

**Expected Result:**
- Tokens transferred from vault to user ATA
- Account balance reset to zero

---

#### TC-022: Partial Withdrawal (Future Feature)
- **Priority:** Low
- **Category:** Functional
- **Environment:** TBD

**Test Steps:**
1. Create time-lock with 10 SOL
2. After unlock, withdraw 3 SOL
3. Verify 7 SOL remains locked

**Expected Result:**
- Partial withdrawal succeeds
- Remaining balance correctly updated

### Query Test Cases

#### TC-030: Get Time-Lock Account Data
- **Priority:** Medium
- **Category:** Functional
- **Environment:** Localnet, Devnet

**Test Steps:**
1. Create time-lock account
2. Call `getTimeLockData()`
3. Verify returned data structure

**Expected Result:**
- Returns complete account data
- All fields populated correctly
- Data matches on-chain account state

---

#### TC-031: Check Withdrawal Availability
- **Priority:** Medium
- **Category:** Functional
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with future unlock time
2. Call `canWithdraw()` - should return false
3. Wait for unlock time to pass
4. Call `canWithdraw()` - should return true

**Expected Result:**
- Method correctly identifies withdrawal availability
- Returns boolean based on current time vs unlock time

---

#### TC-032: Get Remaining Lock Time
- **Priority:** Medium
- **Category:** Functional
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with 1-hour unlock time
2. Immediately call `getRemainingLockTime()`
3. Wait 30 minutes, call again
4. Wait until after unlock, call again

**Expected Result:**
- Initially returns ~3600 seconds
- After 30 minutes returns ~1800 seconds
- After unlock returns 0

## Security Test Cases

### Authorization Test Cases

#### TC-100: Unauthorized Withdrawal Attempt
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet, Devnet

**Test Steps:**
1. Create time-lock account with wallet A
2. Generate new wallet B
3. Wait for unlock time
4. Attempt withdrawal with wallet B as owner

**Expected Result:**
- Transaction fails with Unauthorized error (6002)
- No funds transferred
- Account state unchanged

---

#### TC-101: Invalid PDA Ownership
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock account
2. Manually construct invalid PDA
3. Attempt operations with invalid PDA

**Expected Result:**
- All operations fail with appropriate errors
- No unauthorized access possible

---

#### TC-102: Signature Validation
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Create unsigned transaction
2. Attempt to send without proper signature
3. Send with invalid signature

**Expected Result:**
- Unsigned transactions rejected
- Invalid signatures rejected
- Only valid signatures accepted

### Time Manipulation Test Cases

#### TC-110: Early Withdrawal Prevention
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet, Devnet

**Test Steps:**
1. Create time-lock with future unlock time
2. Attempt withdrawal before unlock time
3. Verify rejection with appropriate error

**Expected Result:**
- Withdrawal fails with TimeLockNotExpired error (6001)
- No funds transferred
- Clear error message provided

---

#### TC-111: Timestamp Validation
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Attempt to create time-lock with past timestamp
2. Attempt with invalid timestamp format
3. Attempt with extremely far future timestamp

**Expected Result:**
- Past timestamps rejected
- Invalid formats rejected
- Very far future timestamps handled correctly

### Input Validation Test Cases

#### TC-120: Amount Validation
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Attempt deposit with zero amount
2. Attempt deposit with negative amount
3. Attempt deposit with extremely large amount

**Expected Result:**
- Zero amounts rejected with validation error
- Negative amounts rejected
- Large amounts handled correctly (if valid)

---

#### TC-121: Public Key Validation
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Attempt operations with invalid public key strings
2. Attempt with null/undefined public keys
3. Attempt with malformed public keys

**Expected Result:**
- All invalid public keys rejected
- Clear error messages provided
- No operations proceed with invalid keys

### Reentrancy Test Cases

#### TC-130: Concurrent Operation Prevention
- **Priority:** High
- **Category:** Security
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock account
2. Initiate withdrawal operation
3. Attempt second withdrawal before first completes

**Expected Result:**
- Second operation fails with OperationInProgress error (6005)
- First operation completes successfully
- No double-spending possible

## Performance Test Cases

### Transaction Throughput

#### TC-200: Batch Account Creation
- **Priority:** Medium
- **Category:** Performance
- **Environment:** Localnet

**Test Steps:**
1. Create 100 time-lock accounts in parallel
2. Measure total execution time
3. Verify all accounts created successfully

**Expected Result:**
- All accounts created within reasonable time
- No failures due to resource constraints
- Parallel operations complete efficiently

---

#### TC-201: Large Amount Handling
- **Priority:** Medium
- **Category:** Performance
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with maximum SOL amount
2. Perform deposit and withdrawal operations
3. Measure transaction processing time

**Expected Result:**
- Large amounts handled efficiently
- No significant performance degradation
- Transaction fees remain reasonable

### Gas Optimization

#### TC-210: Transaction Cost Analysis
- **Priority:** Medium
- **Category:** Performance
- **Environment:** Devnet

**Test Steps:**
1. Record initial wallet balance
2. Perform complete time-lock workflow
3. Calculate total transaction costs

**Expected Result:**
- Total costs under expected thresholds
- Costs comparable to similar operations
- No unexpected fee spikes

## Error Handling Test Cases

### Network Error Handling

#### TC-300: RPC Endpoint Failure
- **Priority:** Medium
- **Category:** Error Handling
- **Environment:** Simulated

**Test Steps:**
1. Configure client with invalid RPC endpoint
2. Attempt time-lock operations
3. Verify error handling

**Expected Result:**
- Operations fail gracefully
- NetworkError thrown with clear message
- No undefined behavior

---

#### TC-301: Transaction Timeout
- **Priority:** Medium
- **Category:** Error Handling
- **Environment:** Simulated

**Test Steps:**
1. Simulate network congestion
2. Send transaction with timeout
3. Verify timeout handling

**Expected Result:**
- Timeout detected and reported
- Retry mechanisms available
- Clear timeout error messages

### Program Error Handling

#### TC-310: Account Not Found
- **Priority:** Medium
- **Category:** Error Handling
- **Environment:** Localnet

**Test Steps:**
1. Generate random account address
2. Attempt to query non-existent account
3. Verify error handling

**Expected Result:**
- Clear "account not found" error
- No crashes or undefined behavior
- Appropriate error code returned

---

#### TC-311: Insufficient Funds
- **Priority:** Medium
- **Category:** Error Handling
- **Environment:** Localnet

**Test Steps:**
1. Attempt operations with insufficient SOL for fees
2. Verify error handling and messages

**Expected Result:**
- Clear insufficient funds error
- Transaction fails gracefully
- User informed of required balance

## Integration Test Cases

### Wallet Integration

#### TC-400: Phantom Wallet Integration
- **Priority:** High
- **Category:** Integration
- **Environment:** Browser Extension

**Test Steps:**
1. Connect Phantom wallet to dApp
2. Perform time-lock operations
3. Verify signature prompts and approvals

**Expected Result:**
- Wallet integration works seamlessly
- Signature prompts appear correctly
- Transactions signed and sent properly

---

#### TC-401: Solflare Wallet Integration
- **Priority:** Medium
- **Category:** Integration
- **Environment:** Browser Extension

**Test Steps:**
1. Connect Solflare wallet
2. Test all major operations
3. Verify compatibility

**Expected Result:**
- Full compatibility with Solflare
- All operations work as expected

### Frontend Framework Integration

#### TC-410: React Hook Integration
- **Priority:** Medium
- **Category:** Integration
- **Environment:** React App

**Test Steps:**
1. Use custom React hooks in component
2. Test state management and updates
3. Verify error handling in UI

**Expected Result:**
- Hooks work correctly in React
- State updates properly
- Errors displayed to user

---

#### TC-411: Vue.js Integration
- **Priority:** Low
- **Category:** Integration
- **Environment:** Vue App

**Test Steps:**
1. Integrate SDK with Vue application
2. Test reactive data updates
3. Verify component lifecycle handling

**Expected Result:**
- SDK integrates seamlessly with Vue
- Reactive updates work correctly

## Edge Case Test Scenarios

### Boundary Conditions

#### TC-500: Minimum Time Lock Duration
- **Priority:** Medium
- **Category:** Edge Case
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with 1-second duration
2. Wait for unlock and attempt immediate withdrawal
3. Verify timing precision

**Expected Result:**
- Very short durations work correctly
- Precise timing validation
- No race conditions

---

#### TC-501: Maximum Time Lock Duration
- **Priority:** Medium
- **Category:** Edge Case
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with maximum future timestamp
2. Verify account creation and data storage
3. Check time calculations

**Expected Result:**
- Far future timestamps handled correctly
- No integer overflow issues
- Time calculations remain accurate

---

#### TC-502: Minimum Amount Handling
- **Priority:** Medium
- **Category:** Edge Case
- **Environment:** Localnet

**Test Steps:**
1. Create time-lock with 1 lamport
2. Perform deposit and withdrawal
3. Verify precision and accuracy

**Expected Result:**
- Minimum amounts handled correctly
- No precision loss
- All operations work with small amounts

### Clock Edge Cases

#### TC-510: Clock Synchronization
- **Priority:** Low
- **Category:** Edge Case
- **Environment:** Multiple Networks

**Test Steps:**
1. Create time-locks on different networks
2. Compare clock behavior
3. Test around epoch boundaries

**Expected Result:**
- Consistent clock behavior across networks
- No unexpected timing issues

---

#### TC-511: Leap Second Handling
- **Priority:** Low
- **Category:** Edge Case
- **Environment:** Theoretical

**Test Steps:**
1. Test timestamp calculations around leap seconds
2. Verify no timing anomalies
3. Check edge cases in time arithmetic

**Expected Result:**
- Leap seconds handled correctly
- No timing calculation errors

## Regression Test Cases

### Previous Bug Fixes

#### TC-600: InstructionDidNotDeserialize Fix
- **Priority:** High
- **Category:** Regression
- **Environment:** Localnet, Devnet

**Test Steps:**
1. Perform withdrawal operation that previously failed
2. Verify fix remains effective
3. Test with various account configurations

**Expected Result:**
- Withdrawal operations succeed
- No deserialization errors
- Previous bug does not reoccur

---

#### TC-601: PDA Generation Consistency
- **Priority:** High
- **Category:** Regression
- **Environment:** Localnet

**Test Steps:**
1. Generate PDAs with same parameters multiple times
2. Verify consistency across sessions
3. Test with edge case parameters

**Expected Result:**
- PDA generation remains deterministic
- Consistent results across all environments
- No regression in PDA logic

### API Compatibility

#### TC-610: Backward Compatibility
- **Priority:** Medium
- **Category:** Regression
- **Environment:** Localnet

**Test Steps:**
1. Test current SDK with older program versions
2. Verify graceful handling of version differences
3. Check for breaking changes

**Expected Result:**
- Backward compatibility maintained where possible
- Clear error messages for incompatible versions
- No unexpected failures

---

## Test Execution Guidelines

### Pre-Test Setup

1. **Environment Preparation:**
   ```bash
   # Start local validator
   solana-test-validator --reset --quiet
   
   # Build and deploy program
   anchor build
   anchor deploy
   ```

2. **Test Data Preparation:**
   - Generate test wallets with sufficient SOL
   - Create test token mints if needed
   - Prepare various test scenarios

### Test Execution Order

1. **Smoke Tests:** Basic functionality (TC-001, TC-010, TC-020)
2. **Security Tests:** Authorization and validation (TC-100-130)
3. **Functional Tests:** Complete feature coverage (TC-001-032)
4. **Performance Tests:** Load and stress testing (TC-200-210)
5. **Integration Tests:** External system compatibility (TC-400-411)
6. **Edge Cases:** Boundary and corner cases (TC-500-511)
7. **Regression Tests:** Previous fixes and compatibility (TC-600-610)

### Test Reporting

Each test case should be documented with:
- Execution timestamp
- Environment details
- Actual vs expected results
- Screenshots/logs for failures
- Performance metrics where applicable

---

This comprehensive test case documentation ensures thorough validation of the Time-Locked Wallet Solana Library across all functional and non-functional requirements.
