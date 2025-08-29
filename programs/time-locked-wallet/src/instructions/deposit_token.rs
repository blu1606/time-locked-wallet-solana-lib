use anchor_lang::prelude::*;
use crate::{state::{TimeLockAccount, AssetType}, errors::TimeLockError};
use anchor_spl::token::{Token, TokenAccount, Transfer, Mint};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositToken<'info> {
        #[account(
        mut,
        seeds = [b"time_lock", initializer.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        constraint = time_lock_account.owner == initializer.key() @ TimeLockError::InvalidAssetType,
        constraint = time_lock_account.asset_type == AssetType::Token @ TimeLockError::InvalidAssetType
    )]

    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub initializer: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_from_ata.mint, // check associated token account mint 
        associated_token::authority = initializer,
    )]
    pub token_from_ata: Account<'info, TokenAccount>,

    #[account(
        mut, 
        associated_token::mint = token_from_ata.mint,
        associated_token::authority = time_lock_account,
    )]
    pub token_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
    // Validate amount
    require!(amount > 0, TimeLockError::InvalidAmount);

    let cpi_accounts = Transfer {
        from: ctx.accounts.token_from_ata.to_account_info(),
        to: ctx.accounts.token_vault.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };

    // init cpi context
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // transfer token
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    // Update token_vault if it's not set yet
    if time_lock_account.token_vault == Pubkey::default() {
        time_lock_account.token_vault = ctx.accounts.token_vault.key();
    }
    
    // Use checked_add to prevent overflow
    time_lock_account.amount = time_lock_account.amount.checked_add(amount)
        .ok_or(TimeLockError::InvalidAmount)?;
    Ok(())
}