/*
    Consolidated instruction modules for time-locked wallet
*/

pub mod initialize;
pub mod deposit;    // Consolidated SOL + Token deposit
pub mod withdraw;   // Consolidated SOL + Token withdraw
pub mod close;      // Account closure and cleanup

pub use initialize::*;
pub use deposit::*;
pub use withdraw::*;
pub use close::*;