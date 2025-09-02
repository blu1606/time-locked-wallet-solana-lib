import { PublicKey } from '@solana/web3.js';
import { WalletInfo } from '../types';
export interface UseLockInfoReturn {
    lockInfo: WalletInfo | null;
    isLoading: boolean;
    error: string | null;
    refreshLockInfo: () => Promise<void>;
}
export declare const useLockInfo: (lockAddress: PublicKey | null) => UseLockInfoReturn;
//# sourceMappingURL=useLockInfo.d.ts.map