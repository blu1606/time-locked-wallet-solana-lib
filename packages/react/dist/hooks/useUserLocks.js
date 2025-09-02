import { useState, useEffect, useCallback } from 'react';
import { useTimeLockContext } from '../provider';
export const useUserLocks = (userAddress) => {
    const { client } = useTimeLockContext();
    const [locks, setLocks] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchLocks = useCallback(async () => {
        if (!client || !userAddress) {
            setLocks([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // This would need to be implemented in the client
            // For now, return empty array
            const userLocks = [];
            setLocks(userLocks);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user locks';
            setError(errorMessage);
            setLocks([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [client, userAddress]);
    useEffect(() => {
        fetchLocks();
    }, [fetchLocks]);
    return {
        locks,
        isLoading,
        error,
        refetch: fetchLocks
    };
};
//# sourceMappingURL=useUserLocks.js.map