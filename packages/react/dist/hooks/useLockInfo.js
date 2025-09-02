import { useState, useEffect, useCallback } from 'react';
import { useTimeLockContext } from '../provider';
export const useLockInfo = (lockAddress) => {
    const { client } = useTimeLockContext();
    const [lockInfo, setLockInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchLockInfo = useCallback(async () => {
        if (!lockAddress || !client) {
            setLockInfo(null);
            setError(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const info = await client.getWalletInfo(lockAddress);
            setLockInfo(info);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lock info';
            setError(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    }, [lockAddress, client]);
    const refreshLockInfo = useCallback(async () => {
        await fetchLockInfo();
    }, [fetchLockInfo]);
    useEffect(() => {
        fetchLockInfo();
    }, [fetchLockInfo]);
    return {
        lockInfo,
        isLoading,
        error,
        refreshLockInfo
    };
};
//# sourceMappingURL=useLockInfo.js.map