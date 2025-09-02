import { PublicKey } from '@solana/web3.js';
import { CreateTimeLockParams } from '../types';
export interface UseLockCreationReturn {
    createLock: (params: CreateTimeLockParams) => Promise<PublicKey | null>;
    isCreating: boolean;
    error: string | null;
    createdLockAddress: PublicKey | null;
    reset: () => void;
}
export declare const useLockCreation: () => UseLockCreationReturn;
//# sourceMappingURL=useLockCreation.d.ts.map