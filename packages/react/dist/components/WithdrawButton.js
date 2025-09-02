import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PublicKey } from '@solana/web3.js';
import { useWithdraw } from '../hooks/useWithdraw';
import { useLockInfo } from '../hooks/useLockInfo';
export const WithdrawButton = ({ lockAddress, onWithdrawSuccess, className = '', disabled = false }) => {
    const lockAddressPK = typeof lockAddress === 'string' ? new PublicKey(lockAddress) : lockAddress;
    const { withdraw, isWithdrawing, error } = useWithdraw();
    const { lockInfo } = useLockInfo(lockAddressPK);
    const handleWithdraw = async () => {
        try {
            const signature = await withdraw({ timeLockAccount: lockAddressPK });
            if (signature && onWithdrawSuccess) {
                onWithdrawSuccess(signature);
            }
        }
        catch (err) {
            console.error('Withdraw failed:', err);
        }
    };
    const canWithdraw = (lockInfo === null || lockInfo === void 0 ? void 0 : lockInfo.isUnlocked) && !disabled;
    let buttonText = 'Withdraw Funds';
    if (!lockInfo)
        buttonText = 'No Lock Data';
    else if (!lockInfo.isUnlocked)
        buttonText = 'Still Locked';
    else if (isWithdrawing)
        buttonText = 'Processing...';
    return (_jsxs("div", { className: `withdraw-button-container ${className}`, children: [_jsx("button", { onClick: handleWithdraw, disabled: !canWithdraw || isWithdrawing || disabled, className: "withdraw-button", children: buttonText }), error && (_jsxs("div", { className: "error", style: { color: 'red', marginTop: '10px' }, children: ["Error: ", error] }))] }));
};
export default WithdrawButton;
//# sourceMappingURL=WithdrawButton.js.map