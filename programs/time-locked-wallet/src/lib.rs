use anchor_lang::prelude::*;

pub mod state;
pub mod instructions; 
pub mod errors;

use instructions::*;

declare_id!("GxyddTYPY6apph2ZVGriqDu6rjWzPpTcMJ8AtCRSgE5P");

#[program]
pub mod time_locked_wallet {
    use super::*;

    // initializes a new time-locked wallet account
    // the account is a PDA derived from the initialier's address and a unique timestamp.
    // It can be used to hold either SOL or SPL tokens.

    pub fn initialize(ctx: Context<Initialize>, unlock_timestamp: i64, bump: u8) -> Result<()> {
        instructions::initialize(ctx, unlock_timestamp, bump)
    }

    // locks an amount of SOL into the time-locked wallet
    // SOL is transferred from the initializer to the program's PDA account. 
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::deposit_sol(ctx, amount)
    }

    // Locls an amount of SPL tokens into the time-locked wallet
    // Tokens are transferred from the initializer's ATA to the program's token vault.
    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        instructions::deposit_token(ctx, amount)
    }

    // Withdraws SOL from the time-locked wallet. 
    // This instruction is only successful if the unlock_timestamp has passed. 
    pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
        instructions::withdraw_sol(ctx)
    }

    // Withdraws SPL tokens from the time-locked wallet.
    // This instruction is only successful if the unlock_timestamp has passed.
    pub fn withdraw_token(ctx: Context<WithdrawToken>) -> Result<()> {
        instructions::withdraw_token(ctx)
    }

}