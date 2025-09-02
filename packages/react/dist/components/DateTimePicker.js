import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { classNames } from '../utils/classNames';
const DateTimePicker = ({ label, value, onChange, min, max, className, error, }) => {
    return (_jsxs("div", { className: classNames('w-full', className), children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: label })), _jsx("input", { type: "datetime-local", value: value, onChange: (e) => onChange(e.target.value), min: min, max: max, className: classNames('block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200', 'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400', 'placeholder-gray-400 dark:placeholder-gray-500', error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500', 'sm:text-sm') }), error && (_jsx("p", { className: "mt-2 text-sm text-red-600 dark:text-red-400", children: error }))] }));
};
export default DateTimePicker;
//# sourceMappingURL=DateTimePicker.js.map