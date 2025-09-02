import { PublicKey } from '@solana/web3.js';
export interface UseUserLocksReturn {
    locks: PublicKey[] | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
export declare const useUserLocks: (userAddress: PublicKey) => UseUserLocksReturn;
//# sourceMappingURL=useUserLocks.d.ts.map