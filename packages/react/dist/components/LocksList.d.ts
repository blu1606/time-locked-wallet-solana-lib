import React from 'react';
import { PublicKey } from '@solana/web3.js';
interface LocksListProps {
    userAddress: string | PublicKey;
    onLockSelect?: (lockAddress: PublicKey) => void;
    onWithdrawSuccess?: (signature: string, lockAddress: PublicKey) => void;
    className?: string;
}
export declare const LocksList: React.FC<LocksListProps>;
export default LocksList;
//# sourceMappingURL=LocksList.d.ts.map