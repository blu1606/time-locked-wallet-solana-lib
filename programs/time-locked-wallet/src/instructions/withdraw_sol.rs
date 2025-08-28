use anchor_lang::{prelude::*, solana_program::system_instruction};
use crate::{state::{TimeLockAccount, AssetType}, errors::TimeLockError};

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut, 
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        // close the account and sends its rent-exempt SOL to owner
        close = owner,
        has_one = owner,
        constraint = time_lock_account.asset_type == AssetType::Sol @TimeLockError::InvalidAssetType
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
    // check if the current timestamp is greater or equal to the unlock timestamp.
    let time_lock_account = &ctx.accounts.time_lock_account;
    let current_timestamp = Clock::get()?.unix_timestamp;

    if current_timestamp < time_lock_account.unlock_timestamp {
        return err!(TimeLockError::WithdrawalTooEarly);
    }

    // Calculate exact amount to transfer (stored amount only, not including rent-exempt lamports)
    let amount_to_transfer = time_lock_account.amount;
    require!(amount_to_transfer > 0, TimeLockError::InvalidAmount);

    // Get current account balance
    let account_balance = time_lock_account.to_account_info().lamports();
    
    // Ensure we have enough balance (account balance should be amount + rent-exempt minimum)
    require!(account_balance >= amount_to_transfer, TimeLockError::InvalidAmount);

    // create transfer instruction for the exact deposited amount
    let ix = system_instruction::transfer(
        &ctx.accounts.time_lock_account.key(),
        &ctx.accounts.owner.key(),
        amount_to_transfer,
    );

    // prepare the seeds used to sign on behalf of the PDA
    let owner_key = ctx.accounts.owner.key();
    let unlock_timestamp_le = time_lock_account.unlock_timestamp.to_le_bytes();
    let time_lock_seeds = &[
        b"time_lock",
        owner_key.as_ref(),
        &unlock_timestamp_le.as_ref(),
        &[time_lock_account.bump],
    ];

    let signer = &[&time_lock_seeds[..]];
    // invoke transfer, signed by PDA
    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.time_lock_account.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        signer,
    )?;

    // Reset the amount to 0 since we've withdrawn everything
    // The account will be closed by Anchor due to the close constraint
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    time_lock_account.amount = 0;

    Ok(())
}