import React, { useState, useEffect } from 'react';
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
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with current value only once
  useEffect(() => {
    if (!isInitialized && value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Format date as YYYY-MM-DD for date input (local time)
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        setDateStr(`${year}-${month}-${day}`);
        
        // Format time as HH:MM for time input (local time)
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        setTimeStr(`${hour}:${minute}`);
        
        setIsInitialized(true);
      }
    } else if (!isInitialized && !value) {
      // Set default to current time + 1 hour (local time)
      const now = new Date();
      now.setHours(now.getHours() + 1);
      
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      setDateStr(`${year}-${month}-${day}`);
      
      const hour = now.getHours().toString().padStart(2, '0');
      const minute = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hour}:${minute}`);
      
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Only update parent when both date and time are complete and valid
  const updateParent = (newDateStr: string, newTimeStr: string) => {
    if (newDateStr && newTimeStr && isInitialized) {
      // Create date object in local timezone (Vietnam time)
      const [year, month, day] = newDateStr.split('-').map(Number);
      const [hour, minute] = newTimeStr.split(':').map(Number);
      
      // Create date in local timezone - this represents Vietnam time
      const dateTime = new Date(year, month - 1, day, hour, minute);
      
      if (!isNaN(dateTime.getTime())) {
        // Create ISO string that represents the same moment in time
        // but formatted as if it were in Vietnam timezone
        const isoString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (isoString !== value) {
          onChange(isoString);
        }
      }
    }
  };

  const handleDateChange = (newDateStr: string) => {
    setDateStr(newDateStr);
    updateParent(newDateStr, timeStr);
  };

  const handleTimeChange = (newTimeStr: string) => {
    setTimeStr(newTimeStr);
    updateParent(dateStr, newTimeStr);
  };

  // Get current datetime for min validation
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD format

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Date
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            min={currentDate}
            className={classNames(
              'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
              'sm:text-sm py-3 px-4',
              error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
            )}
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Time (Vietnam Time)
          </label>
          <input
            type="time"
            value={timeStr}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={classNames(
              'block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-colors duration-200',
              'focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400',
              'sm:text-sm py-3 px-4',
              error && 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
            )}
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default DateTimePicker;