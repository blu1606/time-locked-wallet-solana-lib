import React from 'react';
import { Token } from './TokenSelector';
interface LockCreationFormProps {
    onLockCreated?: (address: string) => void;
    className?: string;
    walletAddress?: string;
    tokens?: Token[];
}
export declare const LockCreationForm: React.FC<LockCreationFormProps>;
export default LockCreationForm;
//# sourceMappingURL=LockCreationForm.d.ts.map