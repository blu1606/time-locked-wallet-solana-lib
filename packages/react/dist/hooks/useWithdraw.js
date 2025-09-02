import { useState, useCallback } from 'react';
import { useTimeLockContext } from '../provider';
export const useWithdraw = () => {
    const { client } = useTimeLockContext();
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [error, setError] = useState(null);
    const [withdrawTxSignature, setWithdrawTxSignature] = useState(null);
    const withdraw = useCallback(async (params) => {
        if (!client) {
            setError('Client not available');
            return null;
        }
        setIsWithdrawing(true);
        setError(null);
        try {
            const txSignature = await client.withdraw(params);
            setWithdrawTxSignature(txSignature);
            return txSignature;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw assets';
            setError(errorMessage);
            return null;
        }
        finally {
            setIsWithdrawing(false);
        }
    }, [client]);
    const reset = useCallback(() => {
        setIsWithdrawing(false);
        setError(null);
        setWithdrawTxSignature(null);
    }, []);
    return {
        withdraw,
        isWithdrawing,
        error,
        withdrawTxSignature,
        reset
    };
};
//# sourceMappingURL=useWithdraw.js.map