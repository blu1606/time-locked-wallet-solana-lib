use anchor_lang::prelude::*;
use crate::state::TimeLockAccount;

// Utility functions for the time-locked wallet program

/// Get time-locked wallet PDA
pub fn get_time_lock_pda(owner: &Pubkey, unlock_timestamp: i64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"time_lock",
            owner.as_ref(),
            &unlock_timestamp.to_le_bytes(),
        ],
        &crate::ID,
    )
}

/// Check if withdrawal is available
pub fn is_withdrawal_available(time_lock_account: &TimeLockAccount) -> Result<bool> {
    let current_timestamp = Clock::get()?.unix_timestamp;
    Ok(current_timestamp >= time_lock_account.unlock_timestamp)
}

/// Get time remaining until unlock
pub fn get_time_remaining(time_lock_account: &TimeLockAccount) -> Result<i64> {
    let current_timestamp = Clock::get()?.unix_timestamp;
    Ok(time_lock_account.unlock_timestamp - current_timestamp)
}