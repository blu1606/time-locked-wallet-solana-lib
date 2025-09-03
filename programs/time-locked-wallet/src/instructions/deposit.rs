use anchor_lang::prelude::*;
use crate::state::{TimeLockAccount, AssetType};
use crate::errors::TimeLockError;
use crate::events::DepositEvent;
use anchor_lang::system_program;
use anchor_spl::token::{Token, TokenAccount, Transfer};

// ============================================================================
// SOL DEPOSIT
// ============================================================================

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
    // 🔍 PHASE 1: CHECKS - Validate all conditions first
    msg!("🔍 Starting SOL deposit validation...");
    
    // Basic validations
    require!(ctx.accounts.time_lock_account.is_initialized, TimeLockError::NotInitialized);
    require!(amount > 0, TimeLockError::InvalidAmount);
    
    // Reentrancy protection
    ctx.accounts.time_lock_account.start_operation()?;
    
    msg!("✅ Validation passed. Depositing: {} lamports", amount);
    
    // 🌐 PHASE 2: INTERACTIONS - Execute transfer first
    msg!("🌐 Executing SOL transfer...");
    
    // Get account key before mutable borrow
    let time_lock_key = ctx.accounts.time_lock_account.key();
    
    // Execute SOL transfer using system_program CPI
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.initializer.to_account_info(),
        to: ctx.accounts.time_lock_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    let result = system_program::transfer(cpi_ctx, amount);
    
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    match result {
        Ok(_) => {
            // 🔧 PHASE 3: EFFECTS - Update state AFTER successful transfer
            msg!("🔧 Updating account balance...");
            
            // Update balance after successful transfer
            time_lock_account.sol_balance = time_lock_account.sol_balance
                .checked_add(amount)
                .ok_or(TimeLockError::ArithmeticOverflow)?;
            
            time_lock_account.amount = time_lock_account.amount
                .checked_add(amount)
                .ok_or(TimeLockError::ArithmeticOverflow)?;
            
            msg!("✅ New balance: {} lamports", time_lock_account.sol_balance);
            
            // Emit deposit event
            emit!(DepositEvent {
                time_lock_account: time_lock_key,
                depositor: ctx.accounts.initializer.key(),
                amount,
                new_balance: time_lock_account.sol_balance,
                timestamp: Clock::get()?.unix_timestamp,
                asset_type: AssetType::Sol,
            });
            
            // ✅ End operation
            time_lock_account.end_operation();
            Ok(())
        },
        Err(e) => {
            msg!("❌ SOL transfer failed: {:?}", e);
            
            // ✅ End operation on failure
            time_lock_account.end_operation();
            Err(e.into())
        }
    }
}

// ============================================================================
// TOKEN DEPOSIT  
// ============================================================================

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
        associated_token::mint = token_from_ata.mint,
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
    
    // Check initialization
    require!(ctx.accounts.time_lock_account.is_initialized, TimeLockError::NotInitialized);
    
    // 🔒 Reentrancy protection
    ctx.accounts.time_lock_account.start_operation()?;

    // Get keys before mutable borrow
    let time_lock_key = ctx.accounts.time_lock_account.key();
    let depositor_key = ctx.accounts.initializer.key();

    // Setup CPI for token transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_from_ata.to_account_info(),
        to: ctx.accounts.token_vault.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // Execute token transfer
    let result = anchor_spl::token::transfer(cpi_ctx, amount);
    
    let time_lock_account = &mut ctx.accounts.time_lock_account;
    
    match result {
        Ok(_) => {
            // Set token_vault if not already set
            if time_lock_account.token_vault == Pubkey::default() {
                time_lock_account.token_vault = ctx.accounts.token_vault.key();
            }
            
            // Update amount with overflow check
            time_lock_account.amount = time_lock_account.amount.checked_add(amount)
                .ok_or(TimeLockError::ArithmeticOverflow)?;

            msg!("Deposited {} tokens to time-locked wallet", amount);
            
            // Emit deposit event
            emit!(DepositEvent {
                time_lock_account: time_lock_key,
                depositor: depositor_key,
                amount,
                new_balance: time_lock_account.amount,
                timestamp: Clock::get()?.unix_timestamp,
                asset_type: AssetType::Token,
            });
            
            // ✅ End operation
            time_lock_account.end_operation();
            Ok(())
        },
        Err(e) => {
            // ✅ End operation on error
            time_lock_account.end_operation();
            Err(e.into())
        }
    }
}
