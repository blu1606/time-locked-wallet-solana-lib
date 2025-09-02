import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useLockCreation } from '../hooks/useLockCreation';
import { useTimeLockContext } from '../provider';
import { AssetType } from '../types';
import { classNames } from '../utils/classNames';
import NumberInput from './NumberInput';
import TokenSelector from './TokenSelector';
import DateTimePicker from './DateTimePicker';
import Button from './Button';
// Default tokens
const DEFAULT_TOKENS = [
    {
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    },
];
export const LockCreationForm = ({ onLockCreated, className = '', walletAddress, tokens = DEFAULT_TOKENS }) => {
    const { connection } = useTimeLockContext();
    const { createLock, isCreating, error, createdLockAddress, reset } = useLockCreation();
    const [selectedToken, setSelectedToken] = useState(tokens[0]);
    const [amount, setAmount] = useState('0.1');
    const [unlockDateTime, setUnlockDateTime] = useState('');
    useEffect(() => {
        // Set default values: current time + 5 minutes
        const setDefaults = async () => {
            try {
                const slot = await connection.getSlot();
                const chainTime = await connection.getBlockTime(slot);
                let baseMs = Date.now();
                if (typeof chainTime === 'number')
                    baseMs = chainTime * 1000;
                const unlockMs = baseMs + 5 * 60 * 1000; // 5 minutes later
                const d = new Date(unlockMs);
                setUnlockDateTime(d.toISOString().slice(0, 16));
                return;
            }
            catch (err) {
                // Fallback to local time
            }
            const fiveMinLater = new Date(Date.now() + 5 * 60 * 1000);
            setUnlockDateTime(fiveMinLater.toISOString().slice(0, 16));
        };
        setDefaults();
    }, [connection]);
    useEffect(() => {
        if (createdLockAddress && onLockCreated) {
            onLockCreated(createdLockAddress.toString());
        }
    }, [createdLockAddress, onLockCreated]);
    // Get current datetime in local timezone for min attribute
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!walletAddress) {
            alert('Please connect your wallet first');
            return;
        }
        if (!amount || !unlockDateTime) {
            alert('Please fill all fields');
            return;
        }
        const unlockDate = new Date(unlockDateTime);
        if (unlockDate <= new Date()) {
            alert('Unlock time must be in the future');
            return;
        }
        const unlockTimestamp = Math.floor(unlockDate.getTime() / 1000);
        const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;
        await createLock({
            owner: new PublicKey(walletAddress),
            unlockTimestamp,
            assetType: selectedToken.symbol === 'SOL' ? AssetType.Sol : AssetType.Token,
            amount: amountInLamports
        });
    };
    return (_jsx("div", { className: classNames('space-y-6', className), children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Lo\u1EA1i t\u00E0i s\u1EA3n" }), _jsx(TokenSelector, { tokens: tokens, selectedToken: selectedToken, onTokenSelect: setSelectedToken })] }), _jsx(NumberInput, { label: "S\u1ED1 l\u01B0\u1EE3ng", value: amount, onChange: (e) => setAmount(e.target.value), suffix: selectedToken.symbol, decimals: selectedToken.decimals, placeholder: "0.00" }), _jsx(DateTimePicker, { label: "Th\u1EDDi gian m\u1EDF kh\u00F3a", value: unlockDateTime, onChange: setUnlockDateTime, min: localDateTime }), amount && unlockDateTime && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "\uD83D\uDCCB Xem tr\u01B0\u1EDBc" }), _jsxs("div", { className: "space-y-1 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("p", { children: ["S\u1ED1 ti\u1EC1n kh\u00F3a: ", _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [amount, " ", selectedToken.symbol] })] }), _jsxs("p", { children: ["Th\u1EDDi gian m\u1EDF kh\u00F3a: ", _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: new Date(unlockDateTime).toLocaleString('vi-VN') })] }), _jsxs("p", { children: ["Th\u1EDDi gian kh\u00F3a: ", _jsxs("span", { className: "font-medium text-gray-900 dark:text-white", children: [Math.floor((new Date(unlockDateTime).getTime() - Date.now()) / (1000 * 60)), " ph\u00FAt"] })] })] })] })), _jsx(Button, { type: "submit", loading: isCreating, disabled: !amount || !unlockDateTime, fullWidth: true, size: "lg", variant: "primary", children: "\uD83D\uDD12 T\u1EA1o Time-Lock Wallet" }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsxs("p", { className: "text-red-800 dark:text-red-200 text-sm", children: ["\u274C L\u1ED7i: ", error] }) })), createdLockAddress && (_jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4", children: [_jsx("p", { className: "text-green-800 dark:text-green-200 text-sm", children: "\u2705 T\u1EA1o lock th\u00E0nh c\u00F4ng!" }), _jsxs("p", { className: "text-green-600 dark:text-green-400 text-xs mt-1", children: ["Address: ", createdLockAddress.toString().slice(0, 8), "...", createdLockAddress.toString().slice(-8)] })] }))] }) }));
};
export default LockCreationForm;
//# sourceMappingURL=LockCreationForm.js.map