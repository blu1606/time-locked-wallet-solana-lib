use anchor_lang::prelude::*;

declare_id!("GxyddTYPY6apph2ZVGriqDu6rjWzPpTcMJ8AtCRSgE5P");

#[program]
pub mod time_locked_wallet {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
