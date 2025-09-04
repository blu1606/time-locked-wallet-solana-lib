import React, { useState, useEffect } from 'react';
import { classNames } from '../utils/classNames';

interface CountdownProps {
  targetDate: Date;
  onExpired?: () => void;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  onExpired,
  className,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!isExpired) {
          setIsExpired(true);
          onExpired?.();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpired, isExpired]);

  if (isExpired) {
    return (
      <div className={classNames(
        'text-green-600 dark:text-green-400 font-medium',
        compact ? 'text-sm' : 'text-base',
        className
      )}>
        Ready to withdraw
      </div>
    );
  }

  if (compact) {
    return (
      <div className={classNames('text-gray-600 dark:text-gray-400 text-sm', className)}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    );
  }

  return (
    <div className={classNames('flex space-x-4 justify-center', className)}>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {timeLeft.days}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Days
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Hours
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Minutes
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Seconds
        </div>
      </div>
    </div>
  );
};

export default Countdown;
