import { PublicKey } from '@solana/web3.js';
// =============================================================================
// SIMPLE VALIDATORS
// =============================================================================
export const validateAddress = (address) => {
    try {
        new PublicKey(address);
        return true;
    }
    catch (_a) {
        return false;
    }
};
export const validateAmount = (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
};
export const validateTimestamp = (timestamp) => {
    return timestamp > Date.now();
};
export const validateRequired = (value) => {
    return value.trim().length > 0;
};
export const validateDateTime = (dateString, timeString) => {
    if (!dateString || !timeString)
        return false;
    const timestamp = new Date(`${dateString}T${timeString}`).getTime();
    return validateTimestamp(timestamp);
};
//# sourceMappingURL=validators.js.map