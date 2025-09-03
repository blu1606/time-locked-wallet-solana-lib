import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AssetType, CreateTimeLockParams, DepositParams, WithdrawParams } from "./types";

/**
 * Mock/Demo TimeLockClient for development when the real client fails
 */
export class MockTimeLockClient {
    private connection: Connection;
    private wallet: anchor.Wallet;

    constructor(connection: Connection, wallet: anchor.Wallet, programId?: PublicKey) {
        this.connection = connection;
        this.wallet = wallet;
        console.log("🔧 Using MockTimeLockClient for development");
    }

    // Simplified interface methods for React compatibility
    async createTimeLock(params: CreateTimeLockParams): Promise<PublicKey> {
        console.log("Mock createTimeLock called with:", params);
        // Return a mock public key
        return new PublicKey("11111111111111111111111111111111");
    }

    async deposit(params: DepositParams): Promise<string> {
        console.log("Mock deposit called with:", params);
        return "mock_signature_" + Date.now();
    }

    async withdraw(params: WithdrawParams): Promise<string> {
        console.log("Mock withdraw called with:", params);
        return "mock_signature_" + Date.now();
    }

    async getWalletInfo(address: PublicKey): Promise<any> {
        console.log("Mock getWalletInfo called for:", address.toString());
        return {
            owner: address,
            unlockTimestamp: new anchor.BN(Date.now() / 1000 + 3600),
            assetType: AssetType.Sol,
            amount: new anchor.BN(1000000000), // 1 SOL
            tokenVault: PublicKey.default,
            isUnlocked: false,
            timeRemaining: new anchor.BN(3600)
        };
    }

    get connectionInstance(): Connection {
        return this.connection;
    }

    get walletInstance(): anchor.Wallet {
        return this.wallet;
    }

    get programId(): PublicKey {
        return new PublicKey("11111111111111111111111111111111");
    }
}
