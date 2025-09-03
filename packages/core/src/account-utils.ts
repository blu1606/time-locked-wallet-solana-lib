import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { validateAndNormalizePublicKey } from './utils/validation';

/**
 * Account utilities for balance checking and airdrop functionality
 */
export class AccountUtils {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(address: PublicKey | string): Promise<number> {
    try {
      const pubkey = validateAndNormalizePublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get balance in lamports
   */
  async getBalanceLamports(address: PublicKey | string): Promise<number> {
    try {
      const pubkey = validateAndNormalizePublicKey(address);
      return await this.connection.getBalance(pubkey);
    } catch (error) {
      console.error('Failed to get balance in lamports:', error);
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Request airdrop (devnet/testnet only)
   */
  async requestAirdrop(address: PublicKey | string, amount: number = 1): Promise<string> {
    try {
      const pubkey = validateAndNormalizePublicKey(address);
      const amountLamports = amount * LAMPORTS_PER_SOL;
      
      console.log(`Requesting ${amount} SOL airdrop for ${pubkey.toString()}`);
      
      const signature = await this.connection.requestAirdrop(pubkey, amountLamports);
      
      console.log('Airdrop signature:', signature);
      
      // Wait for confirmation
      const latestBlockhash = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({
        signature,
        ...latestBlockhash
      }, 'confirmed');
      
      console.log('Airdrop confirmed!');
      
      return signature;
    } catch (error) {
      console.error('Airdrop failed:', error);
      throw new Error(`Airdrop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if account exists (has any balance)
   */
  async accountExists(address: PublicKey | string): Promise<boolean> {
    try {
      const balance = await this.getBalanceLamports(address);
      return balance > 0;
    } catch {
      return false;
    }
  }

  /**
   * Format balance for display
   */
  static formatBalance(balance: number): string {
    return Math.round(balance * 100000) / 100000 + ' SOL';
  }

  /**
   * Convert SOL to lamports
   */
  static solToLamports(sol: number): number {
    return sol * LAMPORTS_PER_SOL;
  }

  /**
   * Convert lamports to SOL
   */
  static lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  }
}

/**
 * Utility functions for balance formatting
 */
export const BalanceUtils = {
  format: AccountUtils.formatBalance,
  solToLamports: AccountUtils.solToLamports,
  lamportsToSol: AccountUtils.lamportsToSol,
};
