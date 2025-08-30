import React from 'react';
import { classNames } from '../utils/classNames';

interface DateTimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  className?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  min,
  className,
}) => {
  // Get current datetime in local timezone for min attribute
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min || localDateTime}
        className={classNames(
          'block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200',
          'focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
          error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
          'sm:text-sm'
        )}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default DateTimePicker;
