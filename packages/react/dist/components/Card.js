import { jsx as _jsx } from "react/jsx-runtime";
import { classNames } from '../utils/classNames';
const Card = ({ children, className, padding = 'md', shadow = 'sm', }) => {
    const paddingClasses = {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
    };
    const shadowClasses = {
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
    };
    return (_jsx("div", { className: classNames('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', paddingClasses[padding], shadowClasses[shadow], className), children: children }));
};
export default Card;
//# sourceMappingURL=Card.js.map