import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useLockInfo } from '../hooks/useLockInfo';
import { AssetType } from '../types';
export const LockInfoCard = ({ lockAddress, className = '' }) => {
    const [timeRemaining, setTimeRemaining] = useState('');
    const { lockInfo, isLoading, error } = useLockInfo(typeof lockAddress === 'string' ? new PublicKey(lockAddress) : lockAddress);
    useEffect(() => {
        if (!lockInfo)
            return;
        const updateTimeRemaining = () => {
            const now = Date.now();
            const unlockMs = lockInfo.unlockTimestamp.toNumber() * 1000;
            const remaining = unlockMs - now;
            if (remaining <= 0) {
                setTimeRemaining('Ready to withdraw!');
                return;
            }
            const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
            const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            }
            else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            }
            else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
        };
        updateTimeRemaining();
        const interval = setInterval(updateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [lockInfo]);
    if (isLoading) {
        return (_jsxs("div", { className: `lock-info-card ${className}`, children: [_jsx("h3", { children: "Lock Information" }), _jsx("div", { children: "Loading..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: `lock-info-card ${className}`, children: [_jsx("h3", { children: "Lock Information" }), _jsxs("div", { className: "error", style: { color: 'red' }, children: ["Error: ", error] })] }));
    }
    if (!lockInfo) {
        return (_jsxs("div", { className: `lock-info-card ${className}`, children: [_jsx("h3", { children: "Lock Information" }), _jsx("div", { children: "No lock data found" })] }));
    }
    const addressStr = typeof lockAddress === 'string' ? lockAddress : lockAddress.toString();
    const isUnlocked = lockInfo.isUnlocked;
    const amountDisplay = lockInfo.assetType === AssetType.Sol
        ? `${(lockInfo.amount.toNumber() / 1e9).toFixed(4)} SOL`
        : `${lockInfo.amount.toString()} tokens`;
    return (_jsxs("div", { className: `lock-info-card ${className}`, children: [_jsx("h3", { children: "Lock Information" }), _jsxs("div", { className: "info-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", addressStr.slice(0, 8), "...", addressStr.slice(-8)] }), _jsxs("p", { children: [_jsx("strong", { children: "Owner:" }), " ", lockInfo.owner.toString().slice(0, 8), "...", lockInfo.owner.toString().slice(-8)] }), _jsxs("p", { children: [_jsx("strong", { children: "Amount:" }), " ", amountDisplay] }), _jsxs("p", { children: [_jsx("strong", { children: "Unlock Time:" }), " ", new Date(lockInfo.unlockTimestamp.toNumber() * 1000).toLocaleString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", isUnlocked ? 'Unlocked ✅' : 'Locked 🔒'] }), _jsxs("p", { children: [_jsx("strong", { children: "Time Remaining:" }), _jsx("span", { style: { color: isUnlocked ? '#28a745' : '#007bff' }, children: timeRemaining })] })] })] }));
};
export default LockInfoCard;
//# sourceMappingURL=LockInfoCard.js.map