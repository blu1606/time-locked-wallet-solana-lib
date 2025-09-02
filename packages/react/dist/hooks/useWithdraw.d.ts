import { WithdrawParams } from '../types';
export interface UseWithdrawReturn {
    withdraw: (params: WithdrawParams) => Promise<string | null>;
    isWithdrawing: boolean;
    error: string | null;
    withdrawTxSignature: string | null;
    reset: () => void;
}
export declare const useWithdraw: () => UseWithdrawReturn;
//# sourceMappingURL=useWithdraw.d.ts.map