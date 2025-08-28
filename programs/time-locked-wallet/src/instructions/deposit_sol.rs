// handles the transfer of SOL to program's PDA

use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use anchor_lang::solana_program::system_instruction;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositSol<'info> {
        #[account(
        mut,
        seeds = [b"time_lock", initializer.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        constraint = time_lock_account.owner == initializer.key() @ TimeLockError::InvalidAssetType,
        constraint = time_lock_account.asset_type == AssetType::Sol @ TimeLockError::InvalidAssetType
    )]

    pub time_lock_account: Account<'info, TimeLockAccount>,

    #[account(mut)]
    pub initializer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
    // Validate amount
    require!(amount > 0, TimeLockError::InvalidAmount);

    // create an instance for transfering
    let ix = system_instruction::transfer(
        &ctx.accounts.initializer.key(), 
        &ctx.accounts.time_lock_account.key(),
        amount,
    );

    // transfer 
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.initializer.to_account_info(),
            ctx.accounts.time_lock_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.amount = time_lock_account.amount.checked_add(amount)
        .ok_or(TimeLockError::InvalidAmount)?;
    Ok(())
}