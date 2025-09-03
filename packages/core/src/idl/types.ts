// Load the actual IDL from the local copy
import idlJson from './time_locked_wallet.json';

export const IDL = idlJson;

export type TimeLockWallet = any; // This will be properly typed when the IDL is fully generated
