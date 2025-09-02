var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { classNames } from '../utils/classNames';
const NumberInput = forwardRef((_a, ref) => {
    var { label, error, suffix, prefix, decimals = 6, className } = _a, props = __rest(_a, ["label", "error", "suffix", "prefix", "decimals", "className"]);
    const handleInputChange = (e) => {
        var _a, _b;
        const value = e.target.value;
        // Allow empty string
        if (value === '') {
            (_a = props.onChange) === null || _a === void 0 ? void 0 : _a.call(props, e);
            return;
        }
        // Validate number format
        const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
        if (regex.test(value)) {
            (_b = props.onChange) === null || _b === void 0 ? void 0 : _b.call(props, e);
        }
    };
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: label })), _jsxs("div", { className: "relative", children: [prefix && (_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx("span", { className: "text-gray-500 dark:text-gray-400 sm:text-sm", children: prefix }) })), _jsx("input", Object.assign({ ref: ref, type: "text", inputMode: "decimal", className: classNames('block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200', 'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400', 'placeholder-gray-400 dark:placeholder-gray-500', error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500', prefix && 'pl-10', suffix && 'pr-12', 'sm:text-sm', className) }, props, { onChange: handleInputChange })), suffix && (_jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none", children: _jsx("span", { className: "text-gray-500 dark:text-gray-400 sm:text-sm", children: suffix }) }))] }), error && (_jsx("p", { className: "mt-2 text-sm text-red-600 dark:text-red-400", children: error }))] }));
});
NumberInput.displayName = 'NumberInput';
export default NumberInput;
//# sourceMappingURL=NumberInput.js.map