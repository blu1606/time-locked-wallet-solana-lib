use anchor_lang::prelude::*;
use crate::{state::{TimeLockAccount, AssetType}, errors::TimeLockError};
use anchor_spl::token::{Token, TokenAccount, Transfer, Mint};

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(
        mut,
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        close = owner,
        has_one = owner,
        constraint = time_lock_account.asset_type == AssetType::Token @TimeLockError::InvalidAssetType,
        constraint = time_lock_account.token_vault == token_from_vault.key() @TimeLockError::InvalidTokenVault
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
    // Check if the current timestamp is greater than or equal to the unlock timestamp.
    let current_timestamp = Clock::get()?.unix_timestamp;
    if current_timestamp < ctx.accounts.time_lock_account.unlock_timestamp {
        return err!(TimeLockError::WithdrawalTooEarly);
    }
    
    // Validate that there are tokens to withdraw
    let amount_to_transfer = ctx.accounts.time_lock_account.amount;
    require!(amount_to_transfer > 0, TimeLockError::InvalidAmount);
    
    // Transfer tokens from the program's vault to the owner's ATA.
    let owner_key = ctx.accounts.owner.key();
    let unlock_timestamp_le = ctx.accounts.time_lock_account.unlock_timestamp.to_le_bytes();
    let time_lock_seeds = &[
        b"time_lock",
        owner_key.as_ref(),
        unlock_timestamp_le.as_ref(),
        &[ctx.accounts.time_lock_account.bump],
    ];
    let signer = &[&time_lock_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.token_from_vault.to_account_info(),
        to: ctx.accounts.token_to_ata.to_account_info(),
        authority: ctx.accounts.time_lock_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    anchor_spl::token::transfer(cpi_ctx, amount_to_transfer)?;

    // Reset the amount to 0 since we've withdrawn everything
    // The account will be closed by Anchor due to the close constraint
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.amount = 0;

    Ok(())
}