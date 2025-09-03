import React from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { useBalance } from '../hooks/useBalance';

interface BalanceDisplayProps {
  connection: Connection;
  address: PublicKey | string | null;
  className?: string;
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Component to display account balance with auto-refresh
 */
export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  connection,
  address,
  className = '',
  showRefreshButton = true,
  autoRefresh = true,
  refreshInterval = 10000,
}) => {
  const { 
    balance, 
    balanceFormatted, 
    isLoading, 
    error, 
    refresh, 
    accountExists 
  } = useBalance(connection, address, { autoRefresh, refreshInterval });

  if (!address) {
    return (
      <div className={`balance-display ${className}`}>
        <span className="text-gray-500">No wallet connected</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`balance-display error ${className}`}>
        <span className="text-red-500">Error: {error}</span>
        {showRefreshButton && (
          <button
            onClick={refresh}
            className="ml-2 px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
            disabled={isLoading}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`balance-display ${className}`}>
      <div className="flex items-center gap-2">
        <span 
          className={`text-2xl font-bold cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
          onClick={refresh}
          title="Click to refresh"
        >
          {isLoading ? 'Loading...' : balanceFormatted}
        </span>
        
        {showRefreshButton && (
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-2 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50"
            title="Refresh balance"
          >
            {isLoading ? '⟳' : '↻'}
          </button>
        )}
      </div>
      
      {!accountExists && balance === 0 && (
        <div className="text-sm text-orange-600 mt-1">
          Account not found or empty
        </div>
      )}
      
      {balance !== null && balance > 0 && (
        <div className="text-sm text-gray-500 mt-1">
          {balance.toFixed(6)} SOL
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;
