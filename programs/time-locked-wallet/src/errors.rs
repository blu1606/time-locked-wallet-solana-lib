use anchor_lang::prelude::*;

#[error_code]
pub enum TimeLockError {
    #[msg("Withdrawal is not yet available. The unlock timestamp has not been reached.")]
    WithdrawalTooEarly,
    #[msg("Invalid asset type for this operation. Expected a different type (SOL or Token).")]
    InvalidAssetType,
    #[msg("Invalid token vault account. The provided vault does not match the one stored on the TimeLockAccount.")]
    InvalidTokenVault,
    #[msg("Invalid timestamp. The unlock timestamp must be in the future.")]
    InvalidTimestamp,
    #[msg("Invalid amount. Amount must be greater than zero.")]
    InvalidAmount,
}