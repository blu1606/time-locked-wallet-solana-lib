import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PublicKey } from '@solana/web3.js';
import { useUserLocks } from '../hooks/useUserLocks';
import { LockInfoCard } from './LockInfoCard';
import { WithdrawButton } from './WithdrawButton';
export const LocksList = ({ userAddress, onLockSelect, onWithdrawSuccess, className = '' }) => {
    const userAddressPK = typeof userAddress === 'string' ? new PublicKey(userAddress) : userAddress;
    const { locks, isLoading, error, refetch } = useUserLocks(userAddressPK);
    const handleLockClick = (lockAddress) => {
        if (onLockSelect) {
            onLockSelect(lockAddress);
        }
    };
    const handleWithdrawSuccess = (signature, lockAddress) => {
        // Refetch locks after successful withdrawal
        refetch();
        if (onWithdrawSuccess) {
            onWithdrawSuccess(signature, lockAddress);
        }
    };
    if (isLoading) {
        return (_jsxs("div", { className: `locks-list ${className}`, children: [_jsx("h3", { children: "Your Time Locks" }), _jsx("div", { children: "Loading locks..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: `locks-list ${className}`, children: [_jsx("h3", { children: "Your Time Locks" }), _jsxs("div", { className: "error", style: { color: 'red' }, children: ["Error: ", error] }), _jsx("button", { onClick: refetch, children: "Retry" })] }));
    }
    if (!locks || locks.length === 0) {
        return (_jsxs("div", { className: `locks-list ${className}`, children: [_jsx("h3", { children: "Your Time Locks" }), _jsx("div", { children: "No time locks found. Create your first lock above!" })] }));
    }
    return (_jsxs("div", { className: `locks-list ${className}`, children: [_jsxs("h3", { children: ["Your Time Locks (", locks.length, ")"] }), _jsx("div", { className: "locks-grid", children: locks.map((lock, index) => (_jsxs("div", { className: "lock-item", style: {
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '16px',
                        margin: '8px 0',
                        cursor: 'pointer'
                    }, onClick: () => handleLockClick(lock), children: [_jsx(LockInfoCard, { lockAddress: lock, className: "lock-card" }), _jsx(WithdrawButton, { lockAddress: lock, onWithdrawSuccess: (signature) => handleWithdrawSuccess(signature, lock), className: "withdraw-section" })] }, lock.toString()))) })] }));
};
export default LocksList;
//# sourceMappingURL=LocksList.js.map