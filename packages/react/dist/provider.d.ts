import { ReactNode } from 'react';
import { Connection } from '@solana/web3.js';
import { TimeLockConfig, TimeLockClient } from './types';
interface TimeLockContextValue {
    connection: Connection;
    config: TimeLockConfig;
    client?: TimeLockClient;
}
interface TimeLockProviderProps {
    children: ReactNode;
    connection: Connection;
    config: TimeLockConfig;
    client?: TimeLockClient;
}
export declare const TimeLockProvider: ({ children, connection, config, client }: TimeLockProviderProps) => import("react/jsx-runtime").JSX.Element;
export declare const useTimeLockContext: () => TimeLockContextValue;
export {};
//# sourceMappingURL=provider.d.ts.map