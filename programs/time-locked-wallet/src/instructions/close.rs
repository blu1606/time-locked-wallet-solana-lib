use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use crate::events::AccountClosureEvent;
use crate::{debug_msg, critical_msg, event_msg};
use anchor_spl::token::{Token, TokenAccount, CloseAccount};

// ============================================================================
// CLOSE EMPTY ACCOUNT
// ============================================================================

#[derive(Accounts)]
pub struct CloseEmptyAccount<'info> {
    #[account(
        mut,
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        has_one = owner @ TimeLockError::Unauthorized,
        constraint = time_lock_account.sol_balance == 0 @ TimeLockError::AccountNotEmpty,
        constraint = time_lock_account.amount == 0 @ TimeLockError::AccountNotEmpty,
        close = owner
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn close_empty_account(ctx: Context<CloseEmptyAccount>) -> Result<()> {
    let time_lock_account = &ctx.accounts.time_lock_account;
    
    debug_msg!("Closing empty account: {}", ctx.accounts.time_lock_account.key());
    
    // Validate account is truly empty
    require!(
        time_lock_account.sol_balance == 0 && time_lock_account.amount == 0,
        TimeLockError::AccountNotEmpty
    );
    
    // Calculate rent refund
    let rent_refund = Rent::get()?.minimum_balance(
        time_lock_account.to_account_info().data_len()
    );
    
    event_msg!("Account closed, rent refunded: {} lamports to {}", 
               rent_refund, ctx.accounts.owner.key());
    
    emit!(AccountClosureEvent {
        time_lock_account: ctx.accounts.time_lock_account.key(),
        owner: ctx.accounts.owner.key(),
        rent_refunded: rent_refund,
        timestamp: Clock::get()?.unix_timestamp,
        closure_reason: "Manual closure of empty account".to_string(),
    });
    
    // Account will be automatically closed by Anchor and rent refunded to owner
    Ok(())
}

// ============================================================================
// CLOSE TOKEN ACCOUNT WITH CLEANUP
// ============================================================================

#[derive(Accounts)]
pub struct CloseTokenAccount<'info> {
    #[account(
        mut,
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        has_one = owner @ TimeLockError::Unauthorized,
        constraint = time_lock_account.asset_type == AssetType::Token @ TimeLockError::InvalidAssetType,
        constraint = time_lock_account.amount == 0 @ TimeLockError::AccountNotEmpty,
        close = owner
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = token_vault.key() == time_lock_account.token_vault @ TimeLockError::InvalidTokenVault,
        constraint = token_vault.amount == 0 @ TimeLockError::AccountNotEmpty
    )]
    pub token_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn close_token_account(ctx: Context<CloseTokenAccount>) -> Result<()> {
    let time_lock_account = &ctx.accounts.time_lock_account;
    
    debug_msg!("Closing token account: {}", ctx.accounts.time_lock_account.key());
    
    // Double check all balances are zero
    require!(time_lock_account.amount == 0, TimeLockError::AccountNotEmpty);
    require!(ctx.accounts.token_vault.amount == 0, TimeLockError::AccountNotEmpty);
    
    // Calculate rent refunds
    let account_rent = Rent::get()?.minimum_balance(
        time_lock_account.to_account_info().data_len()
    );
    let vault_rent = Rent::get()?.minimum_balance(
        ctx.accounts.token_vault.to_account_info().data_len()
    );
    let total_rent_refund = account_rent + vault_rent;
    
    // Prepare PDA signing seeds for closing token vault
    let owner_key = ctx.accounts.owner.key();
    let unlock_timestamp_le = time_lock_account.unlock_timestamp.to_le_bytes();
    let time_lock_seeds = &[
        b"time_lock",
        owner_key.as_ref(),
        unlock_timestamp_le.as_ref(),
        &[time_lock_account.bump],
    ];
    let signer = &[&time_lock_seeds[..]];

    // Close token vault account
    let close_vault_accounts = CloseAccount {
        account: ctx.accounts.token_vault.to_account_info(),
        destination: ctx.accounts.owner.to_account_info(),
        authority: time_lock_account.to_account_info(),
    };
    
    let close_vault_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_vault_accounts,
        signer,
    );
    
    anchor_spl::token::close_account(close_vault_ctx)?;
    
    event_msg!("Token account and vault closed, total rent refunded: {} lamports to {}", 
               total_rent_refund, ctx.accounts.owner.key());
    
    emit!(AccountClosureEvent {
        time_lock_account: ctx.accounts.time_lock_account.key(),
        owner: ctx.accounts.owner.key(),
        rent_refunded: total_rent_refund,
        timestamp: Clock::get()?.unix_timestamp,
        closure_reason: "Manual closure with token vault cleanup".to_string(),
    });
    
    // Time lock account will be automatically closed by Anchor
    Ok(())
}

// ============================================================================
// FORCE CLOSE EXPIRED ACCOUNT (Admin/Cleanup)
// ============================================================================

#[derive(Accounts)]
pub struct ForceCloseExpired<'info> {
    #[account(
        mut,
        seeds = [b"time_lock", original_owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        constraint = Clock::get()?.unix_timestamp > time_lock_account.unlock_timestamp + 86400 * 365 @ TimeLockError::TimeLockNotExpired, // 1 year grace period
        close = rent_collector
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    /// CHECK: Original owner address for PDA derivation
    pub original_owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub rent_collector: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn force_close_expired(ctx: Context<ForceCloseExpired>) -> Result<()> {
    let time_lock_account = &ctx.accounts.time_lock_account;
    let current_time = Clock::get()?.unix_timestamp;
    
    // Ensure account has been expired for more than 1 year (cleanup threshold)
    let cleanup_threshold = time_lock_account.unlock_timestamp + (86400 * 365); // 1 year
    require!(
        current_time > cleanup_threshold,
        TimeLockError::TimeLockNotExpired
    );
    
    let rent_refund = Rent::get()?.minimum_balance(
        time_lock_account.to_account_info().data_len()
    );
    
    critical_msg!("Force closing expired account: {}, expired {} days ago", 
                  ctx.accounts.time_lock_account.key(),
                  (current_time - time_lock_account.unlock_timestamp) / 86400);
    
    emit!(AccountClosureEvent {
        time_lock_account: ctx.accounts.time_lock_account.key(),
        owner: time_lock_account.owner,
        rent_refunded: rent_refund,
        timestamp: current_time,
        closure_reason: format!("Force closure after {} days expired", 
                               (current_time - time_lock_account.unlock_timestamp) / 86400),
    });
    
    // Rent goes to cleanup caller as incentive
    Ok(())
}
