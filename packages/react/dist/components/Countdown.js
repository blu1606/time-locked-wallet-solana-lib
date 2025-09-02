import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { classNames } from '../utils/classNames';
const Countdown = ({ targetDate, onExpired, className, compact = false, }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = targetDate.getTime();
            const difference = target - now;
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
            else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                if (!isExpired) {
                    setIsExpired(true);
                    onExpired === null || onExpired === void 0 ? void 0 : onExpired();
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onExpired, isExpired]);
    if (isExpired) {
        return (_jsx("div", { className: classNames('text-green-600 dark:text-green-400 font-medium', compact ? 'text-sm' : 'text-base', className), children: "\u0110\u00E3 c\u00F3 th\u1EC3 r\u00FAt ti\u1EC1n" }));
    }
    if (compact) {
        return (_jsxs("div", { className: classNames('text-gray-600 dark:text-gray-400 text-sm', className), children: [timeLeft.days > 0 && `${timeLeft.days}d `, String(timeLeft.hours).padStart(2, '0'), ":", String(timeLeft.minutes).padStart(2, '0'), ":", String(timeLeft.seconds).padStart(2, '0')] }));
    }
    return (_jsxs("div", { className: classNames('flex space-x-4', className), children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: timeLeft.days }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: "Ng\u00E0y" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: String(timeLeft.hours).padStart(2, '0') }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: "Gi\u1EDD" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: String(timeLeft.minutes).padStart(2, '0') }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: "Ph\u00FAt" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: String(timeLeft.seconds).padStart(2, '0') }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide", children: "Gi\u00E2y" })] })] }));
};
export default Countdown;
//# sourceMappingURL=Countdown.js.map