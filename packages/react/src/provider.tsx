import React, { createContext, useContext, ReactNode } from 'react';
import { Connection } from '@solana/web3.js';
import { TimeLockConfig, TimeLockClient } from './types';

// =============================================================================
// CONTEXT
// =============================================================================

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

const TimeLockContext = createContext<TimeLockContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

export const TimeLockProvider = ({
  children,
  connection,
  config,
  client
}: TimeLockProviderProps) => {
  const value: TimeLockContextValue = {
    connection,
    config,
    client
  };

  return (
    <TimeLockContext.Provider value={value}>
      {children}
    </TimeLockContext.Provider>
  );
};

// =============================================================================
// HOOK
// =============================================================================

export const useTimeLockContext = (): TimeLockContextValue => {
  const context = useContext(TimeLockContext);
  
  if (!context) {
    throw new Error('useTimeLockContext must be used within a TimeLockProvider');
  }
  
  return context;
};
