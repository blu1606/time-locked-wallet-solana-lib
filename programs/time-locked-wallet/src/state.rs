/*
 defines the on-chain account structures, 
 separating data definitions from the business logic.
*/

use anchor_lang::prelude::*;

// The main account for storing the time-locked wallet state
// This account is a PDA (Program Derived Address)
#[account]
pub struct TimeLockAccount {
    pub owner: Pubkey, // original owner, can withdraw funds.
    pub unlock_timestamp: i64, // timestamp when funds can be withdrawn.
    pub asset_type: AssetType, // SOL or SPL token
    pub bump: u8, // bump seed for PDA
    pub amount: u64, // amount of tokens locked
    pub token_vault: Pubkey, // vault for holding the locked tokens
}

// Enum to define the type of asset being locked. 
#[dereive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum AssetType {
    Sol, 
    Token,
}