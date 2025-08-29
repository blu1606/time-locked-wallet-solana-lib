/**
 * Main client exports
 */
export { TimeLockClient } from "./client";
export { TimeLockClient as DemoClient } from "./client-demo";
/**
 * Core building blocks
 */
export { TimeLockBuilders } from "./builders";
export { TimeLockInstructions } from "./instructions";
/**
 * Types, utilities, and constants
 */
export * from "./types";
/**
 * Re-export common Solana/Anchor types for convenience
 */
export { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
export * as anchor from "@coral-xyz/anchor";
/**
 * Usage Examples:
 *
 * // Main client usage (Production with Anchor - may need IDL setup)
 * import { TimeLockClient } from "@your-org/time-locked-wallet-core";
 * const client = new TimeLockClient(connection, wallet);
 *
 * // Demo/testing usage (Mock implementation, good for testing)
 * import { DemoClient } from "@your-org/time-locked-wallet-core";
 * const demoClient = new DemoClient(connection, wallet);
 *
 * // Direct builder usage (Advanced)
 * import { TimeLockBuilders } from "@your-org/time-locked-wallet-core";
 * const builders = new TimeLockBuilders(program);
 */
