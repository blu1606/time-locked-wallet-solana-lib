use anchor_lang::prelude::*;

pub mod state;
pub mod instructions; 
pub mod errors;
pub mod events;
pub mod utils;

use instructions::*;
use state::AssetType;

declare_id!("899SKikn1WiRBSurKhMZyNCNvYmWXVE6hZFYbFim293g");

#[program]
pub mod time_locked_wallet {
    use super::*;

    // Initializes a new time-locked wallet account
    // The account is a PDA derived from the initializer's address and unlock_timestamp
    // It can be used to hold either SOL or SPL tokens with time-locked access
    pub fn initialize(ctx: Context<Initialize>, unlock_timestamp: i64, asset_type: AssetType) -> Result<()> {
        instructions::initialize(ctx, unlock_timestamp, asset_type)
    }

    // Locks an amount of SOL into the time-locked wallet
    // SOL is transferred from the depositor to the program's PDA account
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::deposit_sol(ctx, amount)
    }

    // Locks an amount of SPL tokens into the time-locked wallet
    // Tokens are transferred from the depositor's ATA to the program's token vault
    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        instructions::deposit_token(ctx, amount)
    }

    // Withdraws SOL from the time-locked wallet
    // This instruction is only successful if the unlock_timestamp has passed
    pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
        instructions::withdraw_sol(ctx)
    }

    // Withdraws SOL and closes the account, refunding rent to owner
    pub fn withdraw_and_close_sol(ctx: Context<WithdrawAndCloseSol>) -> Result<()> {
        instructions::withdraw_and_close_sol(ctx)
    }

    // Withdraws SPL tokens from the time-locked wallet
    // This instruction is only successful if the unlock_timestamp has passed
    pub fn withdraw_token(ctx: Context<WithdrawToken>) -> Result<()> {
        instructions::withdraw_token(ctx)
    }

    // Closes an empty time-locked account and refunds rent to owner
    pub fn close_empty_account(ctx: Context<CloseEmptyAccount>) -> Result<()> {
        instructions::close_empty_account(ctx)
    }

    // Closes a token time-locked account and associated vault, refunding rent
    pub fn close_token_account(ctx: Context<CloseTokenAccount>) -> Result<()> {
        instructions::close_token_account(ctx)
    }

    // Force closes an expired account (cleanup mechanism)
    // Can be called by anyone after 1 year past expiration
    pub fn force_close_expired(ctx: Context<ForceCloseExpired>) -> Result<()> {
        instructions::force_close_expired(ctx)
    }

    // View function to get wallet info without modifying state
    pub fn get_wallet_info(ctx: Context<GetWalletInfo>) -> Result<WalletInfo> {
        let time_lock_account = &ctx.accounts.time_lock_account;
        let current_timestamp = Clock::get()?.unix_timestamp;
        
        Ok(WalletInfo {
            owner: time_lock_account.owner,
            unlock_timestamp: time_lock_account.unlock_timestamp,
            asset_type: time_lock_account.asset_type.clone(),
            amount: time_lock_account.amount,
            token_vault: time_lock_account.token_vault,
            is_unlocked: current_timestamp >= time_lock_account.unlock_timestamp,
            time_remaining: if current_timestamp < time_lock_account.unlock_timestamp {
                time_lock_account.unlock_timestamp - current_timestamp
            } else {
                0
            },
        })
    }
}

#[derive(Accounts)]
pub struct GetWalletInfo<'info> {
    #[account(
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        has_one = owner,
    )]
    pub time_lock_account: Account<'info, state::TimeLockAccount>,
    pub owner: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct WalletInfo {
    pub owner: Pubkey,
    pub unlock_timestamp: i64,
    pub asset_type: AssetType,
    pub amount: u64,
    pub token_vault: Pubkey,
    pub is_unlocked: bool,
    pub time_remaining: i64,
}