import React, { useState } from 'react';
import { classNames } from '../utils/classNames';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface Token {
  symbol: string;
  name: string;
  mint?: string;
  decimals: number;
  logoUrl?: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token;
  onTokenSelect: (token: Token) => void;
  className?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onTokenSelect,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={classNames('relative', className)}>
      <button
        type="button"
        className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center">
          {selectedToken.logoUrl && (
            <img
              src={selectedToken.logoUrl}
              alt={selectedToken.symbol}
              className="h-6 w-6 flex-shrink-0 rounded-full"
            />
          )}
          <span className={classNames('block truncate', selectedToken.logoUrl && 'ml-3')}>
            {selectedToken.symbol}
          </span>
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon
            className={classNames(
              'h-5 w-5 text-gray-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className={classNames(
                  'relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700',
                  selectedToken.symbol === token.symbol
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100'
                )}
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  {token.logoUrl && (
                    <img
                      src={token.logoUrl}
                      alt={token.symbol}
                      className="h-6 w-6 flex-shrink-0 rounded-full"
                    />
                  )}
                  <div className={classNames('flex flex-col', token.logoUrl && 'ml-3')}>
                    <span className="block truncate font-medium">{token.symbol}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{token.name}</span>
                  </div>
                </div>
                {selectedToken.symbol === token.symbol && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600 dark:text-primary-400">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TokenSelector;
