# API Reference - Time-Locked Wallet Solana Library

Complete API documentation for the Time-Locked Wallet Solana Library TypeScript SDK.

## 📋 Table of Contents

1. [Client Classes](#client-classes)
2. [Types and Interfaces](#types-and-interfaces)
3. [Enums](#enums)
4. [Methods Reference](#methods-reference)
5. [Error Handling](#error-handling)
6. [Utilities](#utilities)
7. [Examples](#examples)

## Client Classes

### TimeLockClient

The main client for interacting with the Time-Locked Wallet program.

```typescript
class TimeLockClient {
    constructor(
        connection: Connection,
        wallet: anchor.Wallet,
        programId?: PublicKey
    )
}
```

#### Constructor Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `connection` | `Connection` | Solana RPC connection | Yes |
| `wallet` | `anchor.Wallet` | Wallet for signing transactions | Yes |
| `programId` | `PublicKey` | Custom program ID (optional) | No |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `connectionInstance` | `Connection` | The Solana connection instance |
| `walletInstance` | `anchor.Wallet` | The wallet instance |
| `programInstance` | `anchor.Program` | The Anchor program instance |
| `programId` | `PublicKey` | The program ID |

## Types and Interfaces

### CreateTimeLockParams

Parameters for creating a new time-locked wallet.

```typescript
interface CreateTimeLockParams {
    owner: PublicKey;           // Owner of the time-lock
    unlockTimestamp: number;    // Unix timestamp when funds unlock
    assetType: AssetType;       // Type of asset (SOL or Token)
    amount?: number;            // Optional initial deposit amount
}
```

### DepositParams

Parameters for depositing assets to an existing time-lock.

```typescript
interface DepositParams {
    timeLockAccount: PublicKey; // Time-lock account address
    amount: number;             // Amount to deposit (in lamports for SOL)
    depositor?: PublicKey;      // Optional depositor (defaults to wallet)
}
```

### TokenDepositParams

Extended parameters for depositing SPL tokens.

```typescript
interface TokenDepositParams extends DepositParams {
    tokenFromAta: PublicKey;    // Source Associated Token Account
    tokenVault: PublicKey;      // Token vault account
    tokenProgramId: PublicKey;  // Token program ID
}
```

### WithdrawParams

Parameters for withdrawing assets from a time-lock.

```typescript
interface WithdrawParams {
    timeLockAccount: PublicKey; // Time-lock account address
    owner: PublicKey;           // Owner's public key
}
```

### TokenWithdrawParams

Extended parameters for withdrawing SPL tokens.

```typescript
interface TokenWithdrawParams extends WithdrawParams {
    tokenFromVault: PublicKey;  // Source token vault
    tokenToAta: PublicKey;      // Destination Associated Token Account
    tokenProgramId: PublicKey;  // Token program ID
}
```

### LockCreationResult

Result returned from successful time-lock creation.

```typescript
interface LockCreationResult {
    signature: string;          // Transaction signature
    timeLockAccount: PublicKey; // Created time-lock account address
    assetType: AssetType;       // Type of asset locked
}
```

### TransactionResult

Result returned from transaction building operations.

```typescript
interface TransactionResult {
    transaction: Transaction;        // Built transaction
    timeLockAccount: PublicKey;     // Target time-lock account
    assetType: AssetType;           // Asset type involved
    instructions: TransactionInstruction[]; // Individual instructions
}
```

### WalletInfo

Complete information about a time-locked wallet.

```typescript
interface WalletInfo {
    owner: PublicKey;           // Owner's public key
    unlockTimestamp: anchor.BN; // Unlock timestamp as BigNumber
    assetType: AssetType;       // Asset type (SOL or Token)
    amount: anchor.BN;          // Current balance as BigNumber
    tokenVault: PublicKey;      // Token vault address (if applicable)
    isUnlocked: boolean;        // Whether the time-lock has expired
    timeRemaining: anchor.BN;   // Seconds remaining until unlock
}
```

### TimeLockConfig

Configuration options for the client.

```typescript
interface TimeLockConfig {
    programId: string;                        // Program ID as string
    cluster: 'mainnet' | 'devnet' | 'testnet' | 'localhost'; // Network cluster
    commitment?: anchor.web3.Commitment;     // Transaction commitment level
}
```

## Enums

### AssetType

Supported asset types for time-locked wallets.

```typescript
enum AssetType {
    Sol = "sol",      // Solana native token
    Token = "token"   // SPL Token
}
```

## Methods Reference

### SOL Operations

#### createSolTimeLock

Create a new SOL time-locked wallet.

```typescript
async createSolTimeLock(
    params: CreateTimeLockParams
): Promise<LockCreationResult>
```

**Parameters:**
- `params`: `CreateTimeLockParams` - Creation parameters

**Returns:**
- `Promise<LockCreationResult>` - Creation result with signature and account

**Example:**
```typescript
const result = await client.createSolTimeLock({
    owner: wallet.publicKey,
    unlockTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    assetType: AssetType.Sol,
    amount: 1_000_000_000 // 1 SOL in lamports
});
```

**Throws:**
- `ValidationError` - Invalid parameters
- `NetworkError` - Network or RPC issues
- `ProgramError` - On-chain program errors

#### depositSol

Deposit SOL to an existing time-locked wallet.

```typescript
async depositSol(params: DepositParams): Promise<string>
```

**Parameters:**
- `params`: `DepositParams` - Deposit parameters

**Returns:**
- `Promise<string>` - Transaction signature

**Example:**
```typescript
const signature = await client.depositSol({
    timeLockAccount: timeLockAccountAddress,
    amount: 500_000_000 // 0.5 SOL
});
```

#### withdrawSol

Withdraw SOL from a time-locked wallet (only after unlock time).

```typescript
async withdrawSol(params: WithdrawParams): Promise<string>
```

**Parameters:**
- `params`: `WithdrawParams` - Withdrawal parameters

**Returns:**
- `Promise<string>` - Transaction signature

**Example:**
```typescript
const signature = await client.withdrawSol({
    timeLockAccount: timeLockAccountAddress,
    owner: wallet.publicKey
});
```

### Token Operations

#### createTokenTimeLock

Create a new SPL token time-locked wallet.

```typescript
async createTokenTimeLock(
    params: CreateTimeLockParams,
    depositParams?: Omit<TokenDepositParams, 'timeLockAccount'>
): Promise<LockCreationResult>
```

**Parameters:**
- `params`: `CreateTimeLockParams` - Creation parameters
- `depositParams`: Optional initial deposit parameters

**Returns:**
- `Promise<LockCreationResult>` - Creation result

**Example:**
```typescript
const result = await client.createTokenTimeLock({
    owner: wallet.publicKey,
    unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    assetType: AssetType.Token
});
```

#### depositToken

Deposit SPL tokens to an existing time-locked wallet.

```typescript
async depositToken(params: TokenDepositParams): Promise<string>
```

**Parameters:**
- `params`: `TokenDepositParams` - Token deposit parameters

**Returns:**
- `Promise<string>` - Transaction signature

**Example:**
```typescript
const signature = await client.depositToken({
    timeLockAccount: timeLockAccountAddress,
    amount: 1000000, // Adjust for token decimals
    tokenFromAta: userTokenAccount,
    tokenVault: vaultAccount,
    tokenProgramId: TOKEN_PROGRAM_ID
});
```

#### withdrawToken

Withdraw SPL tokens from a time-locked wallet.

```typescript
async withdrawToken(params: TokenWithdrawParams): Promise<string>
```

**Parameters:**
- `params`: `TokenWithdrawParams` - Token withdrawal parameters

**Returns:**
- `Promise<string>` - Transaction signature

### Query Operations

#### getTimeLockData

Get complete data for a time-locked wallet account.

```typescript
async getTimeLockData(timeLockAccount: PublicKey): Promise<any>
```

**Parameters:**
- `timeLockAccount`: `PublicKey` - Time-lock account address

**Returns:**
- `Promise<any>` - Account data

**Example:**
```typescript
const accountData = await client.getTimeLockData(timeLockAccount);
console.log('Balance:', accountData.amount.toString());
console.log('Unlock time:', accountData.unlockTimestamp.toString());
```

#### canWithdraw

Check if a time-locked wallet can be withdrawn.

```typescript
async canWithdraw(timeLockAccount: PublicKey): Promise<boolean>
```

**Parameters:**
- `timeLockAccount`: `PublicKey` - Time-lock account address

**Returns:**
- `Promise<boolean>` - Whether withdrawal is currently allowed

**Example:**
```typescript
const canWithdraw = await client.canWithdraw(timeLockAccount);
if (canWithdraw) {
    console.log('Funds can be withdrawn now');
} else {
    console.log('Funds are still locked');
}
```

#### getRemainingLockTime

Get remaining lock time in seconds.

```typescript
async getRemainingLockTime(timeLockAccount: PublicKey): Promise<number>
```

**Parameters:**
- `timeLockAccount`: `PublicKey` - Time-lock account address

**Returns:**
- `Promise<number>` - Seconds remaining until unlock (0 if already unlocked)

**Example:**
```typescript
const timeRemaining = await client.getRemainingLockTime(timeLockAccount);
console.log(`Time remaining: ${timeRemaining} seconds`);
```

### Utility Methods

#### findTimeLockPDA

Calculate the Program Derived Address for a time-lock.

```typescript
async findTimeLockPDA(
    owner: PublicKey,
    unlockTimestamp: number
): Promise<[PublicKey, number]>
```

**Parameters:**
- `owner`: `PublicKey` - Owner's public key
- `unlockTimestamp`: `number` - Unlock timestamp

**Returns:**
- `Promise<[PublicKey, number]>` - PDA address and bump seed

**Example:**
```typescript
const [pda, bump] = await client.findTimeLockPDA(
    wallet.publicKey,
    Math.floor(Date.now() / 1000) + 3600
);
```

### Static Validation Methods

#### validatePublicKey

Validate a public key format.

```typescript
static validatePublicKey(key: PublicKey): void
```

**Parameters:**
- `key`: `PublicKey` - Public key to validate

**Throws:**
- `ValidationError` - If key is invalid

#### validateTimestamp

Validate a timestamp.

```typescript
static validateTimestamp(timestamp: number): void
```

**Parameters:**
- `timestamp`: `number` - Unix timestamp to validate

**Throws:**
- `ValidationError` - If timestamp is invalid or in the past

#### validateAmount

Validate an amount.

```typescript
static validateAmount(amount: number): void
```

**Parameters:**
- `amount`: `number` - Amount to validate

**Throws:**
- `ValidationError` - If amount is invalid (≤ 0)

## Error Handling

### Error Types

#### ValidationError

Thrown when input validation fails.

```typescript
class ValidationError extends Error {
    constructor(message: string)
}
```

**Common Causes:**
- Invalid public key format
- Negative or zero amounts
- Past timestamps
- Invalid parameters

#### NetworkError

Thrown when network or RPC operations fail.

```typescript
class NetworkError extends Error {
    constructor(message: string, public cause?: Error)
}
```

**Common Causes:**
- RPC endpoint unreachable
- Transaction timeout
- Network congestion
- Insufficient SOL for fees

#### ProgramError

Thrown when the on-chain program returns an error.

```typescript
class ProgramError extends Error {
    constructor(
        message: string,
        public code: number,
        public logs?: string[]
    )
}
```

**Common Error Codes:**
- `6001`: TimeLockNotExpired - Withdrawal attempted before unlock time
- `6002`: Unauthorized - Unauthorized access attempt
- `6003`: InvalidAmount - Invalid amount provided
- `6004`: InvalidTimestamp - Invalid timestamp provided
- `6005`: OperationInProgress - Operation already in progress

### Error Handling Examples

#### Basic Error Handling

```typescript
try {
    const result = await client.createSolTimeLock(params);
    console.log('Success:', result);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Validation failed:', error.message);
    } else if (error instanceof NetworkError) {
        console.error('Network error:', error.message);
    } else if (error instanceof ProgramError) {
        console.error(`Program error ${error.code}: ${error.message}`);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

#### Specific Error Code Handling

```typescript
try {
    await client.withdrawSol(params);
} catch (error) {
    if (error instanceof ProgramError) {
        switch (error.code) {
            case 6001: // TimeLockNotExpired
                console.log('Withdrawal not yet available');
                break;
            case 6002: // Unauthorized
                console.log('Not authorized to withdraw from this account');
                break;
            default:
                console.error('Program error:', error.message);
        }
    }
}
```

## Utilities

### Constants

```typescript
export const PROGRAM_ID = new PublicKey("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g");
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export const ERROR_MESSAGES = {
    INVALID_AMOUNT: "Amount must be greater than 0",
    INVALID_TIMESTAMP: "Unlock timestamp must be in the future",
    ACCOUNT_NOT_FOUND: "TimeLock account not found",
    FETCH_FAILED: "Failed to fetch account data",
    WITHDRAWAL_TOO_EARLY: "Withdrawal is not yet available",
};
```

### Helper Functions

#### findTimeLockPDA (Standalone)

```typescript
export async function findTimeLockPDA(
    owner: PublicKey,
    unlockTimestamp: number,
    programId: PublicKey = PROGRAM_ID
): Promise<[PublicKey, number]>
```

#### validatePublicKey (Standalone)

```typescript
export function validatePublicKey(key: PublicKey): void
```

#### validateTimestamp (Standalone)

```typescript
export function validateTimestamp(timestamp: number): void
```

#### validateAmount (Standalone)

```typescript
export function validateAmount(amount: number): void
```

## Examples

### Complete SOL Time-Lock Example

```typescript
import { 
    TimeLockClient, 
    AssetType, 
    CreateTimeLockParams,
    DepositParams,
    WithdrawParams 
} from '@time-locked-wallet/core';
import { Connection, PublicKey } from '@solana/web3.js';

async function completeSOLExample() {
    // Initialize client
    const connection = new Connection('https://api.devnet.solana.com');
    const client = new TimeLockClient(connection, wallet);
    
    // Create time-lock (unlock in 1 hour)
    const createParams: CreateTimeLockParams = {
        owner: wallet.publicKey,
        unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
        assetType: AssetType.Sol,
        amount: 1_000_000_000 // 1 SOL
    };
    
    const createResult = await client.createSolTimeLock(createParams);
    console.log('Created time-lock:', createResult.timeLockAccount.toString());
    
    // Deposit additional SOL
    const depositParams: DepositParams = {
        timeLockAccount: createResult.timeLockAccount,
        amount: 500_000_000 // 0.5 SOL
    };
    
    const depositSignature = await client.depositSol(depositParams);
    console.log('Deposited SOL:', depositSignature);
    
    // Check status
    const canWithdraw = await client.canWithdraw(createResult.timeLockAccount);
    const timeRemaining = await client.getRemainingLockTime(createResult.timeLockAccount);
    
    console.log('Can withdraw:', canWithdraw);
    console.log('Time remaining:', timeRemaining, 'seconds');
    
    // Wait for unlock time (in real app, you'd check periodically)
    if (canWithdraw) {
        const withdrawParams: WithdrawParams = {
            timeLockAccount: createResult.timeLockAccount,
            owner: wallet.publicKey
        };
        
        const withdrawSignature = await client.withdrawSol(withdrawParams);
        console.log('Withdrew SOL:', withdrawSignature);
    }
}
```

### Token Time-Lock Example

```typescript
async function tokenTimeLockExample() {
    const client = new TimeLockClient(connection, wallet);
    
    // Create token time-lock
    const result = await client.createTokenTimeLock({
        owner: wallet.publicKey,
        unlockTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        assetType: AssetType.Token
    });
    
    // Deposit tokens
    await client.depositToken({
        timeLockAccount: result.timeLockAccount,
        amount: 1000000, // 1 token (assuming 6 decimals)
        tokenFromAta: userTokenAccount,
        tokenVault: vaultAccount,
        tokenProgramId: TOKEN_PROGRAM_ID
    });
    
    // Later, withdraw tokens
    if (await client.canWithdraw(result.timeLockAccount)) {
        await client.withdrawToken({
            timeLockAccount: result.timeLockAccount,
            owner: wallet.publicKey,
            tokenFromVault: vaultAccount,
            tokenToAta: userTokenAccount,
            tokenProgramId: TOKEN_PROGRAM_ID
        });
    }
}
```

### Error Handling Example

```typescript
async function robustTimeLockOperation() {
    const client = new TimeLockClient(connection, wallet);
    
    try {
        // Validate inputs before sending
        TimeLockClient.validateAmount(1_000_000_000);
        TimeLockClient.validateTimestamp(Math.floor(Date.now() / 1000) + 3600);
        
        const result = await client.createSolTimeLock({
            owner: wallet.publicKey,
            unlockTimestamp: Math.floor(Date.now() / 1000) + 3600,
            assetType: AssetType.Sol,
            amount: 1_000_000_000
        });
        
        return result;
        
    } catch (error) {
        if (error instanceof ValidationError) {
            console.error('Input validation failed:', error.message);
            // Show user-friendly error message
        } else if (error instanceof NetworkError) {
            console.error('Network issue:', error.message);
            // Retry or show network error message
        } else if (error instanceof ProgramError) {
            switch (error.code) {
                case 6004:
                    console.error('Invalid timestamp provided');
                    break;
                case 6003:
                    console.error('Invalid amount provided');
                    break;
                default:
                    console.error('Program error:', error.message);
            }
        } else {
            console.error('Unexpected error:', error);
            // Log to error tracking service
        }
        
        throw error; // Re-throw if needed
    }
}
```

---

For more examples and usage patterns, see the test files in the `/tests` directory of the repository.
