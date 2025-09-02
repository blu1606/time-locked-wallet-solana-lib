import { AssetType } from '../types';
// =============================================================================
// SIMPLE FORMATTERS
// =============================================================================
export const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
};
export const formatTimeRemaining = (seconds) => {
    if (seconds <= 0)
        return 'Available now';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
        return `${days}d ${hours}h`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    else {
        return `${minutes}m`;
    }
};
export const formatAmount = (amount, assetType) => {
    if (assetType === AssetType.Sol) {
        const sol = amount / 1e9;
        return `${sol.toFixed(4)} SOL`;
    }
    else {
        const tokens = amount / 1e6;
        return `${tokens.toFixed(2)} Tokens`;
    }
};
export const formatAddress = (address) => {
    if (address.length <= 8)
        return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
//# sourceMappingURL=formatters.js.map