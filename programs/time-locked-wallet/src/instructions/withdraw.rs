use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use anchor_lang::system_program;
use anchor_spl::token::{Token, TokenAccount, Transfer};

// ============================================================================
// SOL WITHDRAW
// ============================================================================

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut, 
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        close = owner, // Close account and send rent to owner
        has_one = owner,
        constraint = time_lock_account.asset_type == AssetType::Sol @ TimeLockError::InvalidAssetType
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
    let time_lock_account = &ctx.accounts.time_lock_account;
    let current_timestamp = Clock::get()?.unix_timestamp;

    // Check if unlock time has passed
    if current_timestamp < time_lock_account.unlock_timestamp {
        return err!(TimeLockError::WithdrawalTooEarly);
    }

    // Validate withdrawal amount
    let amount_to_transfer = time_lock_account.amount;
    require!(amount_to_transfer > 0, TimeLockError::InvalidAmount);

    // Verify account has sufficient balance
    let account_balance = time_lock_account.to_account_info().lamports();
    require!(account_balance >= amount_to_transfer, TimeLockError::InvalidAmount);

    // Prepare PDA signing seeds
    let owner_key = ctx.accounts.owner.key();
    let unlock_timestamp_le = time_lock_account.unlock_timestamp.to_le_bytes();
    let time_lock_seeds = &[
        b"time_lock",
        owner_key.as_ref(),
        &unlock_timestamp_le.as_ref(),
        &[time_lock_account.bump],
    ];
    let signer = &[&time_lock_seeds[..]];

    // Execute SOL transfer using system_program CPI with signer
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.time_lock_account.to_account_info(),
        to: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    system_program::transfer(cpi_ctx, amount_to_transfer)?;

    // Reset amount (account will be closed by Anchor)
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.amount = 0;

    msg!("Withdrawn {} lamports from time-locked wallet", amount_to_transfer);
    Ok(())
}

// ============================================================================
// TOKEN WITHDRAW
// ============================================================================

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(
        mut,
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        close = owner, // Close account and send rent to owner
        has_one = owner,
        constraint = time_lock_account.asset_type == AssetType::Token @ TimeLockError::InvalidAssetType,
        constraint = time_lock_account.token_vault == token_from_vault.key() @ TimeLockError::InvalidTokenVault
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub token_from_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_from_vault.mint,
        associated_token::authority = owner
    )]
    pub token_to_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_token(ctx: Context<WithdrawToken>) -> Result<()> {
    let time_lock_account = &ctx.accounts.time_lock_account;
    let current_timestamp = Clock::get()?.unix_timestamp;

    // Check if unlock time has passed
    if current_timestamp < time_lock_account.unlock_timestamp {
        return err!(TimeLockError::WithdrawalTooEarly);
    }
    
    // Validate withdrawal amount
    let amount_to_transfer = time_lock_account.amount;
    require!(amount_to_transfer > 0, TimeLockError::InvalidAmount);
    
    // Prepare PDA signing seeds
    let owner_key = ctx.accounts.owner.key();
    let unlock_timestamp_le = time_lock_account.unlock_timestamp.to_le_bytes();
    let time_lock_seeds = &[
        b"time_lock",
        owner_key.as_ref(),
        unlock_timestamp_le.as_ref(),
        &[time_lock_account.bump],
    ];
    let signer = &[&time_lock_seeds[..]];

    // Setup CPI for token transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_from_vault.to_account_info(),
        to: ctx.accounts.token_to_ata.to_account_info(),
        authority: ctx.accounts.time_lock_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    // Execute token transfer
    anchor_spl::token::transfer(cpi_ctx, amount_to_transfer)?;

    // Reset amount (account will be closed by Anchor)
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.amount = 0;

    msg!("Withdrawn {} tokens from time-locked wallet", amount_to_transfer);
    Ok(())
}