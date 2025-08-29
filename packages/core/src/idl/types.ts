import { Idl } from "@coral-xyz/anchor";

// Import the real IDL JSON
export const IDL = require("./time_locked_wallet.json") as Idl;

// Export the type for the program
export type TimeLockWallet = typeof IDL;
