import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { classNames } from '../utils/classNames';
const Modal = ({ isOpen, onClose, children, title, className, size = 'md', }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    if (!isOpen)
        return null;
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "flex min-h-screen items-center justify-center p-4", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), _jsxs("div", { className: classNames('relative w-full transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all', sizeClasses[size], className), children: [title && (_jsxs("div", { className: "border-b border-gray-200 dark:border-gray-700 px-6 py-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: title }), _jsx("button", { onClick: onClose, className: "absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] })), _jsx("div", { className: "px-6 py-4", children: children })] })] }) }));
};
export default Modal;
//# sourceMappingURL=Modal.js.map