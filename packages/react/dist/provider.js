import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const TimeLockContext = createContext(undefined);
// =============================================================================
// PROVIDER
// =============================================================================
export const TimeLockProvider = ({ children, connection, config, client }) => {
    const value = {
        connection,
        config,
        client
    };
    return (_jsx(TimeLockContext.Provider, { value: value, children: children }));
};
// =============================================================================
// HOOK
// =============================================================================
export const useTimeLockContext = () => {
    const context = useContext(TimeLockContext);
    if (!context) {
        throw new Error('useTimeLockContext must be used within a TimeLockProvider');
    }
    return context;
};
//# sourceMappingURL=provider.js.map