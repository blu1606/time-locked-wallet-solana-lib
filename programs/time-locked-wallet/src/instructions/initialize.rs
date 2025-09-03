// handles the initialization of TimeLockAccount

use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};

#[derive(Accounts)]
#[instruction(unlock_timestamp: i64, asset_type: AssetType)] // retrieve unlock_timestamp and asset_type
pub struct Initialize<'info> {
    // CHECK: the PDA will be initialized by the program.
    // initializer: the one init the transaction
    #[account(
        init, // new account has been created
        payer = initializer,
        space = 8 + 32 + 8 + 1 + 1 + 8 + 32, // discriminator (8) + Pubkey (32) + unlock_timestamp (i64), + bump (1) + asset_type (1) + amount (8) + token_vault (32)
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
    // Validate timestamp is in the future
    let current_timestamp = Clock::get()?.unix_timestamp;
    require!(unlock_timestamp > current_timestamp, crate::errors::TimeLockError::InvalidTimestamp);

    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.owner = ctx.accounts.initializer.key(); // store public key
    time_lock_account.unlock_timestamp = unlock_timestamp;
    time_lock_account.bump = ctx.bumps.time_lock_account; // use auto-generated bump
    time_lock_account.asset_type = asset_type; // use provided asset_type
    time_lock_account.amount = 0;
    time_lock_account.token_vault = Pubkey::default(); // will be set if SPL

    Ok(())
}