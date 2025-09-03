use anchor_lang::prelude::*;
use crate::AssetType;

// === CREATION EVENTS ===
#[event]
pub struct TimeLockCreated {
    pub time_lock_account: Pubkey,
    pub owner: Pubkey,
    pub unlock_timestamp: i64,
    pub asset_type: AssetType,
    pub current_timestamp: i64,  // For frontend calculations
}

// === DEPOSIT EVENTS ===
#[event]
pub struct DepositEvent {
    pub time_lock_account: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
    pub timestamp: i64,
    pub asset_type: AssetType,  // For frontend filtering
}

// === WITHDRAWAL EVENTS ===
#[event]
pub struct WithdrawalEvent {
    pub time_lock_account: Pubkey,
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub remaining_balance: u64,
    pub timestamp: i64,
    pub asset_type: AssetType,  // For frontend filtering
}

// === SECURITY EVENTS ===
#[event]
pub struct ReentrancyDetected {
    pub time_lock_account: Pubkey,
    pub caller: Pubkey,
    pub timestamp: i64,
    pub operation_attempted: String,  // For debugging
}

// === VALIDATION EVENTS === 
#[event]
pub struct ValidationFailed {
    pub time_lock_account: Pubkey,
    pub caller: Pubkey,
    pub error_code: u32,
    pub error_message: String,
    pub timestamp: i64,
    pub current_balance: u64,
    pub unlock_timestamp: i64,
}

// === LIFECYCLE EVENTS ===
#[event]
pub struct AccountClosed {
    pub time_lock_account: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}
