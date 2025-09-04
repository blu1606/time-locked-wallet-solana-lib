import React, { forwardRef } from 'react';
import { classNames } from '../utils/classNames';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  min?: number;
  max?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, suffix, prefix, decimals = 6, className, ...props }, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Allow empty string
      if (value === '') {
        props.onChange?.(e);
        return;
      }

      // Validate number format
      const regex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
      if (regex.test(value)) {
        props.onChange?.(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{prefix}</span>
            </div>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            className={classNames(
              'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
              'placeholder-gray-400 dark:placeholder-gray-500',
              error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
              prefix && 'pl-10',
              suffix && 'pr-12',
              'sm:text-sm py-3 px-4',
              className
            )}
            {...props}
            onChange={handleInputChange}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{suffix}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
