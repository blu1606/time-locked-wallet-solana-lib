use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use crate::events::WithdrawalEvent;
use crate::{debug_msg, critical_msg, event_msg};
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
        has_one = owner @ TimeLockError::Unauthorized,
        constraint = time_lock_account.asset_type == AssetType::Sol @ TimeLockError::InvalidAssetType
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawAndCloseSol<'info> {
    #[account(
        mut, 
        seeds = [b"time_lock", owner.key().as_ref(), &time_lock_account.unlock_timestamp.to_le_bytes()],
        bump = time_lock_account.bump,
        has_one = owner @ TimeLockError::Unauthorized,
        constraint = time_lock_account.asset_type == AssetType::Sol @ TimeLockError::InvalidAssetType,
        close = owner
    )]
    pub time_lock_account: Account<'info, TimeLockAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    debug_msg!("Withdrawal initiated for account: {}", ctx.accounts.time_lock_account.key());
    
    time_lock_account.start_operation_with_monitoring(ctx.accounts.owner.key())?;
    time_lock_account.validate_sol_withdrawal()?;
    
    let amount_to_transfer = time_lock_account.sol_balance;
    require!(amount_to_transfer > 0, TimeLockError::InsufficientBalance);
    
    debug_msg!("Withdrawal amount: {} lamports", amount_to_transfer);
    
    time_lock_account.sol_balance = 0;
    time_lock_account.amount = 0;
    
    let result = (|| -> Result<()> {
        let time_lock_lamports = time_lock_account.to_account_info().lamports();
        let rent_exempt_amount = Rent::get()?.minimum_balance(
            time_lock_account.to_account_info().data_len()
        );
        
        let available_lamports = time_lock_lamports.saturating_sub(rent_exempt_amount);
        require!(
            available_lamports >= amount_to_transfer,
            TimeLockError::InsufficientFunds
        );
        
        **time_lock_account.to_account_info().try_borrow_mut_lamports()? -= amount_to_transfer;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount_to_transfer;
        
        Ok(())
    })();
    
    time_lock_account.end_operation();
    
    match result {
        Ok(_) => {
            event_msg!("Withdrawal completed: {} lamports to {}", 
                      amount_to_transfer, ctx.accounts.owner.key());
            
            emit!(WithdrawalEvent {
                time_lock_account: ctx.accounts.time_lock_account.key(),
                owner: ctx.accounts.owner.key(),
                recipient: ctx.accounts.owner.key(),
                amount: amount_to_transfer,
                remaining_balance: 0,
                timestamp: Clock::get()?.unix_timestamp,
                asset_type: AssetType::Sol,
            });
            
            Ok(())
        },
        Err(e) => {
            critical_msg!("Withdrawal failed, rolling back: {:?}", e);
            time_lock_account.sol_balance = amount_to_transfer;
            time_lock_account.amount = amount_to_transfer;
            Err(e.into())
        }
    }
}

pub fn withdraw_and_close_sol(ctx: Context<WithdrawAndCloseSol>) -> Result<()> {
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    debug_msg!("Withdrawal and closure initiated for account: {}", ctx.accounts.time_lock_account.key());
    
    time_lock_account.start_operation_with_monitoring(ctx.accounts.owner.key())?;
    time_lock_account.validate_sol_withdrawal()?;
    
    let amount_to_transfer = time_lock_account.sol_balance;
    require!(amount_to_transfer > 0, TimeLockError::InsufficientBalance);
    
    // Calculate rent that will be refunded
    let rent_refund = Rent::get()?.minimum_balance(
        time_lock_account.to_account_info().data_len()
    );
    
    debug_msg!("Withdrawal: {} lamports, Rent refund: {} lamports", 
               amount_to_transfer, rent_refund);
    
    // Set balance to 0 before transfer
    time_lock_account.sol_balance = 0;
    time_lock_account.amount = 0;
    
    let result = (|| -> Result<()> {
        let account_info = time_lock_account.to_account_info();
        let current_lamports = account_info.lamports();
        
        // Ensure we have enough lamports for both withdrawal and rent
        require!(
            current_lamports >= amount_to_transfer + rent_refund,
            TimeLockError::InsufficientFunds
        );
        
        // Transfer withdrawal amount to owner
        **account_info.try_borrow_mut_lamports()? -= amount_to_transfer;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount_to_transfer;
        
        Ok(())
    })();
    
    time_lock_account.end_operation();
    
    match result {
        Ok(_) => {
            event_msg!("Withdrawal and closure completed: {} lamports + {} rent to {}", 
                      amount_to_transfer, rent_refund, ctx.accounts.owner.key());
            
            emit!(WithdrawalEvent {
                time_lock_account: ctx.accounts.time_lock_account.key(),
                owner: ctx.accounts.owner.key(),
                recipient: ctx.accounts.owner.key(),
                amount: amount_to_transfer,
                remaining_balance: 0,
                timestamp: Clock::get()?.unix_timestamp,
                asset_type: AssetType::Sol,
            });
            
            // Account will be automatically closed by Anchor and rent refunded
            Ok(())
        },
        Err(e) => {
            critical_msg!("Withdrawal and closure failed, rolling back: {:?}", e);
            time_lock_account.sol_balance = amount_to_transfer;
            time_lock_account.amount = amount_to_transfer;
            Err(e.into())
        }
    }
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
        return err!(TimeLockError::TimeLockNotExpired);
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