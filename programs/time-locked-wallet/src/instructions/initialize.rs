// handles the initialization of TimeLockAccount

use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use crate::events::TimeLockCreated;

#[derive(Accounts)]
#[instruction(unlock_timestamp: i64, asset_type: AssetType)] // retrieve unlock_timestamp and asset_type
pub struct Initialize<'info> {
    // CHECK: the PDA will be initialized by the program.
    // initializer: the one init the transaction
    #[account(
        init, // new account has been created
        payer = initializer,
        space = TimeLockAccount::INIT_SPACE, // Use proper space calculation
        seeds = [b"time_lock", initializer.key().as_ref(), &unlock_timestamp.to_le_bytes()],
        bump,
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,

    #[account(mut)]
    pub initializer: Signer<'info>, // require sign the transaction 

    pub system_program: Program<'info, System>,
}

// create data for time_lock_account
pub fn initialize(ctx: Context<Initialize>, unlock_timestamp: i64, asset_type: AssetType) -> Result<()> {
    // 🔍 Validate timestamp is in the future
    let current_timestamp = Clock::get()?.unix_timestamp;
    require!(unlock_timestamp > current_timestamp, TimeLockError::InvalidUnlockTime);

    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    msg!("🏗️ Initializing time lock account...");
    
    // Initialize account data
    time_lock_account.owner = ctx.accounts.initializer.key(); // store public key
    time_lock_account.unlock_timestamp = unlock_timestamp;
    time_lock_account.bump = ctx.bumps.time_lock_account; // use auto-generated bump
    time_lock_account.asset_type = asset_type.clone(); // use provided asset_type
    time_lock_account.amount = 0;
    time_lock_account.token_vault = Pubkey::default(); // will be set if SPL
    
    // 🔒 Initialize reentrancy protection
    time_lock_account.is_initialized = true;
    time_lock_account.sol_balance = 0;
    time_lock_account.spl_token_account = None;
    time_lock_account.is_processing = false; // Critical: Initialize as false
    
    msg!("✅ Time lock account initialized successfully");
    msg!("📍 Owner: {}", time_lock_account.owner);
    msg!("⏰ Unlock timestamp: {}", time_lock_account.unlock_timestamp);
    msg!("💎 Asset type: {:?}", time_lock_account.asset_type);
    
    // Emit creation event
    emit!(TimeLockCreated {
        time_lock_account: ctx.accounts.time_lock_account.key(),
        owner: ctx.accounts.initializer.key(),
        unlock_timestamp,
        asset_type,
        current_timestamp,
    });

    Ok(())
}