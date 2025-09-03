use anchor_lang::prelude::*;

#[error_code]
pub enum TimeLockError {
    // === TIMING ERRORS (1000-1099) ===
    #[msg("TIME_LOCK_NOT_EXPIRED: Withdrawal blocked - unlock time not reached")]
    TimeLockNotExpired = 1001,
    
    #[msg("INVALID_UNLOCK_TIME: Unlock timestamp must be in the future")]
    InvalidUnlockTime = 1002,
    
    // === BALANCE ERRORS (1100-1199) ===
    #[msg("INSUFFICIENT_BALANCE: Account balance too low for withdrawal")]
    InsufficientBalance = 1101,
    
    #[msg("INVALID_AMOUNT: Amount must be greater than zero")]
    InvalidAmount = 1102,
    
    #[msg("ACCOUNT_NOT_EMPTY: Cannot close account with remaining funds")]
    AccountNotEmpty = 1103,
    
    // === ASSET TYPE ERRORS (1200-1299) ===
    #[msg("INVALID_ASSET_TYPE: Operation not supported for this asset type")]
    InvalidAssetType = 1201,
    
    #[msg("INVALID_TOKEN_VAULT: Token vault mismatch")]
    InvalidTokenVault = 1202,
    
    // === AUTHORIZATION ERRORS (1300-1399) ===
    #[msg("UNAUTHORIZED: Caller is not the account owner")]
    Unauthorized = 1301,
    
    // === SECURITY ERRORS (1400-1499) ===
    #[msg("REENTRANCY_DETECTED: Operation already in progress")]
    OperationInProgress = 1401,
    
    // === STATE ERRORS (1500-1599) ===
    #[msg("NOT_INITIALIZED: Account not properly initialized")]
    NotInitialized = 1501,
    
    // === SYSTEM ERRORS (1600-1699) ===
    #[msg("ARITHMETIC_OVERFLOW: Mathematical operation overflow")]
    ArithmeticOverflow = 1601,
    
    #[msg("TRANSFER_FAILED: Blockchain transfer operation failed")]
    TransferFailed = 1602,
    
    #[msg("UNSUPPORTED_VERSION: Program version not supported")]
    UnsupportedVersion = 1603,
}