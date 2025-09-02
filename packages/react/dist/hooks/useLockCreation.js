import { useState, useCallback } from 'react';
import { useTimeLockContext } from '../provider';
export const useLockCreation = () => {
    const { client } = useTimeLockContext();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [createdLockAddress, setCreatedLockAddress] = useState(null);
    const createLock = useCallback(async (params) => {
        if (!client) {
            setError('Client not available');
            return null;
        }
        setIsCreating(true);
        setError(null);
        try {
            const address = await client.createTimeLock(params);
            setCreatedLockAddress(address);
            return address;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create lock';
            setError(errorMessage);
            return null;
        }
        finally {
            setIsCreating(false);
        }
    }, [client]);
    const reset = useCallback(() => {
        setIsCreating(false);
        setError(null);
        setCreatedLockAddress(null);
    }, []);
    return {
        createLock,
        isCreating,
        error,
        createdLockAddress,
        reset
    };
};
//# sourceMappingURL=useLockCreation.js.map