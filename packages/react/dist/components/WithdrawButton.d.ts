import React from 'react';
import { PublicKey } from '@solana/web3.js';
interface WithdrawButtonProps {
    lockAddress: string | PublicKey;
    onWithdrawSuccess?: (signature: string) => void;
    className?: string;
    disabled?: boolean;
}
export declare const WithdrawButton: React.FC<WithdrawButtonProps>;
export default WithdrawButton;
//# sourceMappingURL=WithdrawButton.d.ts.map