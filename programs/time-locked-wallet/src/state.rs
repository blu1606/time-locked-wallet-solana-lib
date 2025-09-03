/*
 defines the on-chain account structures, 
 separating data definitions from the business logic.
*/

use anchor_lang::prelude::*;
use crate::errors::TimeLockError;

// The main account for storing the time-locked wallet state
// This account is a PDA (Program Derived Address)
#[account]
pub struct TimeLockAccount {
    pub owner: Pubkey, // original owner, can withdraw funds.
    pub unlock_timestamp: i64, // timestamp when funds can be withdrawn.
    pub asset_type: AssetType, // SOL or SPL token
    pub bump: u8, // bump seed for PDA
    pub amount: u64, // amount of tokens locked
    pub token_vault: Pubkey, // vault for holding the locked tokens
    pub is_initialized: bool,
    pub sol_balance: u64, // balance of SOL locked
    pub spl_token_account: Option<Pubkey>,
    pub is_processing: bool, // flag to prevent concurrent operations
}

impl TimeLockAccount {
    // Correct space calculation including ALL fields
    pub const INIT_SPACE: usize = 8 + // discriminator
        32 + // owner: Pubkey
        8 +  // unlock_timestamp: i64
        1 +  // asset_type: AssetType enum
        1 +  // bump: u8
        8 +  // amount: u64
        32 + // token_vault: Pubkey
        1 +  // is_initialized: bool
        8 +  // sol_balance: u64
        33 + // spl_token_account: Option<Pubkey> (1 + 32)
        1;   // is_processing: bool - reentrancy guard
    
    // 🔐 Start critical operation with reentrancy protection
    pub fn start_operation(&mut self) -> Result<()> {
        require!(
            !self.is_processing,
            TimeLockError::OperationInProgress
        );
        self.is_processing = true;
        Ok(())
    }
    
    // 🔐 Start operation with monitoring for reentrancy detection
    pub fn start_operation_with_monitoring(&mut self, caller: Pubkey) -> Result<()> {
        if self.is_processing {
            // Log reentrancy attempt
            msg!("🚨 Reentrancy attack detected from caller: {}", caller);
            return Err(TimeLockError::OperationInProgress.into());
        }
        self.is_processing = true;
        Ok(())
    }
    
    // ✅ End critical operation
    pub fn end_operation(&mut self) {
        self.is_processing = false;
    }
    
    // 🕒 Check if time lock is expired with detailed logging
    pub fn is_unlocked(&self) -> Result<bool> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let is_expired = current_time >= self.unlock_timestamp;
        
        // 📊 Detailed logging for frontend debugging
        msg!("🕒 Time Check - Current: {}, Unlock: {}, Expired: {}", 
             current_time, self.unlock_timestamp, is_expired);
        
        if !is_expired {
            let time_remaining = self.unlock_timestamp - current_time;
            msg!("⏱️ Time remaining: {} seconds ({} hours)", 
                 time_remaining, time_remaining / 3600);
        }
        
        Ok(is_expired)
    }
    
    // 💰 Validate withdrawal conditions for SOL with detailed logging
    pub fn validate_sol_withdrawal(&self) -> Result<()> {
        msg!("🔍 Validating SOL withdrawal...");
        
        // Check initialization
        if !self.is_initialized {
            msg!("❌ VALIDATION_FAILED: Account not initialized");
            return Err(TimeLockError::NotInitialized.into());
        }
        
        // Check unlock time
        if !self.is_unlocked()? {
            msg!("❌ VALIDATION_FAILED: Time lock not expired");
            return Err(TimeLockError::TimeLockNotExpired.into());
        }
        
        // Check balance
        if self.sol_balance == 0 {
            msg!("❌ VALIDATION_FAILED: Insufficient balance - Current: {} lamports", 
                 self.sol_balance);
            return Err(TimeLockError::InsufficientBalance.into());
        }
        
        msg!("✅ VALIDATION_SUCCESS: Ready for withdrawal - Balance: {} lamports", 
             self.sol_balance);
        Ok(())
    }
}

// Enum to define the type of asset being locked
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum AssetType {
    Sol, 
    Token,
}